import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const prisma = new PrismaClient();

// All task routes require authentication
router.use(authenticate);

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  date: z.string(), // YYYY-MM-DD
  timeSlot: z.string(), // HH:00-HH:00
  slotHour: z.number().int().min(0).max(23),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().positive().default(1),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  timeSlot: z.string().optional(),
  slotHour: z.number().int().min(0).max(23).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  tags: z.array(z.string()).optional(),
  estimatedHours: z.number().positive().optional(),
});

const statusUpdateSchema = z.object({
  status: z.enum(['COMPLETED', 'NOT_COMPLETED']),
  notCompletedReason: z.string().min(20).optional(),
  reasonCategory: z.string().optional(),
  actualHours: z.number().positive().optional(),
});

// GET /api/tasks?date=YYYY-MM-DD
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Date parameter required (YYYY-MM-DD)' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.user.userId,
        date: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { slotHour: 'asc' },
    });

    res.json({ tasks });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tasks/month?month=YYYY-MM
router.get('/month', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) {
      return res.status(400).json({ error: 'Month parameter required (YYYY-MM)' });
    }

    const [year, mon] = month.split('-').map(Number);
    const startOfMonth = new Date(year, mon - 1, 1);
    const endOfMonth = new Date(year, mon, 0, 23, 59, 59, 999);

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.user.userId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      orderBy: [{ date: 'asc' }, { slotHour: 'asc' }],
    });

    // Group by date
    const grouped = {};
    tasks.forEach(task => {
      const dateKey = task.date.toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(task);
    });

    res.json({ tasks, grouped });
  } catch (err) {
    console.error('Get month tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/tasks
router.post('/', validate(createTaskSchema), async (req, res) => {
  try {
    const task = await prisma.task.create({
      data: {
        userId: req.user.userId,
        title: req.body.title,
        description: req.body.description || '',
        date: new Date(req.body.date),
        timeSlot: req.body.timeSlot,
        slotHour: req.body.slotHour,
        priority: req.body.priority,
        tags: JSON.stringify(req.body.tags || []),
        estimatedHours: req.body.estimatedHours,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'TASK_CREATED',
        entity: 'Task',
        entityId: task.id,
        details: JSON.stringify({ title: task.title, date: req.body.date }),
      },
    });

    // Socket event
    req.io?.emitTaskEvent('task:created', {
      userId: req.user.userId,
      userName: req.user.name,
      task: { id: task.id, title: task.title, date: req.body.date, timeSlot: task.timeSlot },
    });

    res.status(201).json({ task });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/tasks/:id
router.put('/:id', validate(updateTaskSchema), async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task || task.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.title && { title: req.body.title }),
        ...(req.body.description !== undefined && { description: req.body.description }),
        ...(req.body.timeSlot && { timeSlot: req.body.timeSlot }),
        ...(req.body.slotHour !== undefined && { slotHour: req.body.slotHour }),
        ...(req.body.priority && { priority: req.body.priority }),
        ...(req.body.tags && { tags: JSON.stringify(req.body.tags) }),
        ...(req.body.estimatedHours && { estimatedHours: req.body.estimatedHours }),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'TASK_UPDATED',
        entity: 'Task',
        entityId: task.id,
      },
    });

    req.io?.emitTaskEvent('task:updated', {
      userId: req.user.userId,
      userName: req.user.name,
      task: { id: updated.id, title: updated.title },
    });

    res.json({ task: updated });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/tasks/:id/status
router.patch('/:id/status', validate(statusUpdateSchema), async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task || task.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const data = { status: req.body.status };

    if (req.body.status === 'COMPLETED') {
      data.completedAt = new Date();
      data.actualHours = req.body.actualHours || task.estimatedHours;
    } else if (req.body.status === 'NOT_COMPLETED') {
      data.notCompletedAt = new Date();
      data.notCompletedReason = req.body.notCompletedReason;
      data.reasonCategory = req.body.reasonCategory;
    }

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: req.body.status === 'COMPLETED' ? 'TASK_COMPLETED' : 'TASK_NOT_COMPLETED',
        entity: 'Task',
        entityId: task.id,
        details: req.body.notCompletedReason || null,
      },
    });

    const eventName = req.body.status === 'COMPLETED' ? 'task:completed' : 'task:not-completed';
    req.io?.emitTaskEvent(eventName, {
      userId: req.user.userId,
      userName: req.user.name,
      task: { id: updated.id, title: updated.title, status: updated.status },
    });

    // Admin notification for not-completed
    if (req.body.status === 'NOT_COMPLETED') {
      req.io?.to('admin').emit('admin:notification', {
        type: 'flagged',
        message: `${req.user.name} marked "${updated.title}" as not completed`,
        reason: req.body.notCompletedReason,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({ task: updated });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task || task.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await prisma.task.delete({ where: { id: req.params.id } });

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'TASK_DELETED',
        entity: 'Task',
        entityId: req.params.id,
        details: JSON.stringify({ title: task.title }),
      },
    });

    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
