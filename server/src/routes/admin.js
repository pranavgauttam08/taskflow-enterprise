import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const prisma = new PrismaClient();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(requireAdmin);

// ===================== OVERVIEW =====================

// GET /api/admin/reports/overview — KPI dashboard stats
router.get('/reports/overview', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0, 0, 0, 0);

    const [totalEmployees, todayTasks, weekTasks] = await Promise.all([
      prisma.user.count({ where: { role: 'EMPLOYEE', isActive: true } }),
      prisma.task.findMany({ where: { date: { gte: todayStart, lte: todayEnd } } }),
      prisma.task.findMany({ where: { date: { gte: weekStart, lte: todayEnd } } }),
    ]);

    const todayCompleted = todayTasks.filter(t => t.status === 'COMPLETED').length;
    const weekHours = weekTasks.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + (t.actualHours || t.estimatedHours), 0);
    const flaggedToday = todayTasks.filter(t => t.status === 'NOT_COMPLETED').length;
    const completionRate = todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0;

    res.json({
      totalEmployees,
      tasksCreatedToday: todayTasks.length,
      tasksCompletedToday: todayCompleted,
      companyCompletionRate: completionRate,
      weekHoursLogged: Math.round(weekHours * 10) / 10,
      flaggedTasks: flaggedToday,
    });
  } catch (err) {
    console.error('Overview error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/reports/leaderboard
router.get('/reports/leaderboard', async (req, res) => {
  try {
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
    const { metric = 'completed' } = req.query;

    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE', isActive: true },
      select: { id: true, name: true, department: true, avatarUrl: true },
    });

    const leaderboard = await Promise.all(employees.map(async (emp) => {
      const tasks = await prisma.task.findMany({
        where: { userId: emp.id, date: { gte: weekStart, lte: todayEnd } },
      });
      const completed = tasks.filter(t => t.status === 'COMPLETED').length;
      const total = tasks.length;
      const hours = tasks.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + (t.actualHours || t.estimatedHours), 0);
      return {
        ...emp,
        tasksCompleted: completed,
        totalTasks: total,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        hoursLogged: Math.round(hours * 10) / 10,
      };
    }));

    // Sort by metric
    if (metric === 'rate') {
      leaderboard.sort((a, b) => b.completionRate - a.completionRate);
    } else if (metric === 'hours') {
      leaderboard.sort((a, b) => b.hoursLogged - a.hoursLogged);
    } else {
      leaderboard.sort((a, b) => b.tasksCompleted - a.tasksCompleted);
    }

    res.json({ leaderboard: leaderboard.slice(0, 10) });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================== EMPLOYEES =====================

// GET /api/admin/employees
router.get('/employees', async (req, res) => {
  try {
    const { search, department, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { role: 'EMPLOYEE' };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }
    if (department) where.department = department;

    const [employees, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, email: true, name: true, department: true, avatarUrl: true, isActive: true, lastLogin: true, createdAt: true },
        skip,
        take: parseInt(limit),
        orderBy: { name: 'asc' },
      }),
      prisma.user.count({ where }),
    ]);

    // Add task stats for each employee
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now); monthEnd.setHours(23, 59, 59, 999);

    const enriched = await Promise.all(employees.map(async (emp) => {
      const monthTasks = await prisma.task.findMany({
        where: { userId: emp.id, date: { gte: monthStart, lte: monthEnd } },
      });
      const completed = monthTasks.filter(t => t.status === 'COMPLETED').length;
      const hours = monthTasks.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + (t.actualHours || t.estimatedHours), 0);

      return {
        ...emp,
        tasksThisMonth: monthTasks.length,
        completionRate: monthTasks.length > 0 ? Math.round((completed / monthTasks.length) * 100) : 0,
        hoursLogged: Math.round(hours * 10) / 10,
      };
    }));

    res.json({
      employees: enriched,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('Employees error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/employees/:id
router.get('/employees/:id', async (req, res) => {
  try {
    const employee = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, email: true, name: true, department: true, avatarUrl: true, isActive: true, lastLogin: true, createdAt: true, role: true },
    });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    // Get all-time stats
    const tasks = await prisma.task.findMany({ where: { userId: employee.id } });
    const completed = tasks.filter(t => t.status === 'COMPLETED');
    const totalHours = completed.reduce((s, t) => s + (t.actualHours || t.estimatedHours), 0);

    res.json({
      employee,
      stats: {
        totalTasks: tasks.length,
        totalCompleted: completed.length,
        completionRate: tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0,
        totalHours: Math.round(totalHours * 10) / 10,
      },
    });
  } catch (err) {
    console.error('Employee detail error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/employees/:id/tasks
router.get('/employees/:id/tasks', async (req, res) => {
  try {
    const { date, status, page = '1', limit = '25' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { userId: req.params.id };
    if (date) {
      const d = new Date(date); d.setHours(0, 0, 0, 0);
      const dEnd = new Date(date); dEnd.setHours(23, 59, 59, 999);
      where.date = { gte: d, lte: dEnd };
    }
    if (status) where.status = status;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({ where, skip, take: parseInt(limit), orderBy: [{ date: 'desc' }, { slotHour: 'asc' }] }),
      prisma.task.count({ where }),
    ]);

    res.json({ tasks, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error('Employee tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/employees — create new employee
const createEmployeeSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
  department: z.string().min(1),
});

router.post('/employees', validate(createEmployeeSchema), async (req, res) => {
  try {
    const existing = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (existing) return res.status(409).json({ error: 'Email already exists' });

    const hashed = await bcrypt.hash(req.body.password, 12);
    const employee = await prisma.user.create({
      data: { ...req.body, password: hashed, role: 'EMPLOYEE' },
      select: { id: true, email: true, name: true, department: true, role: true, createdAt: true },
    });

    await prisma.auditLog.create({
      data: { userId: req.user.userId, action: 'EMPLOYEE_CREATED', entity: 'User', entityId: employee.id },
    });

    res.status(201).json({ employee });
  } catch (err) {
    console.error('Create employee error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/employees/:id/status
router.patch('/employees/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const employee = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive },
      select: { id: true, name: true, isActive: true },
    });

    await prisma.auditLog.create({
      data: { userId: req.user.userId, action: isActive ? 'EMPLOYEE_ACTIVATED' : 'EMPLOYEE_DEACTIVATED', entity: 'User', entityId: employee.id },
    });

    res.json({ employee });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===================== REPORTS =====================

// GET /api/admin/reports/tasks
router.get('/reports/tasks', async (req, res) => {
  try {
    const { dateFrom, dateTo, employeeId, department, status, priority, page = '1', limit = '25' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) { const d = new Date(dateTo); d.setHours(23, 59, 59, 999); where.date.lte = d; }
    }
    if (employeeId) where.userId = employeeId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    // Department filter requires join
    let userFilter;
    if (department) {
      const deptUsers = await prisma.user.findMany({ where: { department }, select: { id: true } });
      where.userId = { in: deptUsers.map(u => u.id) };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: { user: { select: { name: true, department: true, avatarUrl: true } } },
        skip,
        take: parseInt(limit),
        orderBy: [{ date: 'desc' }, { slotHour: 'asc' }],
      }),
      prisma.task.count({ where }),
    ]);

    const allTasks = await prisma.task.findMany({ where, select: { status: true } });
    const totalCompleted = allTasks.filter(t => t.status === 'COMPLETED').length;

    res.json({
      tasks,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      summary: {
        totalTasks: total,
        completionRate: total > 0 ? Math.round((totalCompleted / total) * 100) : 0,
      },
    });
  } catch (err) {
    console.error('Reports tasks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/reports/departments
router.get('/reports/departments', async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now); monthEnd.setHours(23, 59, 59, 999);

    const departments = await prisma.user.groupBy({
      by: ['department'],
      where: { role: 'EMPLOYEE', isActive: true },
      _count: { id: true },
    });

    const deptStats = await Promise.all(departments.map(async (dept) => {
      const users = await prisma.user.findMany({
        where: { department: dept.department, role: 'EMPLOYEE' },
        select: { id: true },
      });
      const userIds = users.map(u => u.id);

      const tasks = await prisma.task.findMany({
        where: { userId: { in: userIds }, date: { gte: monthStart, lte: monthEnd } },
      });

      const completed = tasks.filter(t => t.status === 'COMPLETED').length;
      const hours = tasks.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + (t.actualHours || t.estimatedHours), 0);

      return {
        department: dept.department,
        employeeCount: dept._count.id,
        totalTasks: tasks.length,
        completed,
        completionRate: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0,
        hoursLogged: Math.round(hours * 10) / 10,
      };
    }));

    res.json({ departments: deptStats });
  } catch (err) {
    console.error('Department report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/reports/completion
router.get('/reports/completion', async (req, res) => {
  try {
    const now = new Date();
    // Past 6 months weekly completion rate
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const allTasks = await prisma.task.findMany({
      where: { date: { gte: sixMonthsAgo } },
      select: { date: true, status: true, slotHour: true, priority: true, reasonCategory: true },
    });

    // Weekly trend
    const weeklyTrend = [];
    const weekCursor = new Date(sixMonthsAgo);
    while (weekCursor < now) {
      const weekEnd = new Date(weekCursor);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekTasks = allTasks.filter(t => t.date >= weekCursor && t.date < weekEnd);
      const completed = weekTasks.filter(t => t.status === 'COMPLETED').length;
      weeklyTrend.push({
        week: weekCursor.toISOString().split('T')[0],
        total: weekTasks.length,
        completed,
        rate: weekTasks.length > 0 ? Math.round((completed / weekTasks.length) * 100) : 0,
      });
      weekCursor.setDate(weekCursor.getDate() + 7);
    }

    // Day of week analysis
    const dayOfWeekStats = [0, 1, 2, 3, 4, 5, 6].map(day => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayTasks = allTasks.filter(t => t.date.getDay() === day);
      const completed = dayTasks.filter(t => t.status === 'COMPLETED').length;
      return {
        day: dayNames[day],
        total: dayTasks.length,
        completed,
        rate: dayTasks.length > 0 ? Math.round((completed / dayTasks.length) * 100) : 0,
      };
    });

    // Peak hours
    const hourStats = {};
    for (let h = 0; h < 24; h++) {
      const hourTasks = allTasks.filter(t => t.slotHour === h);
      hourStats[h] = {
        hour: h,
        total: hourTasks.length,
        completed: hourTasks.filter(t => t.status === 'COMPLETED').length,
      };
    }

    // Priority completion
    const priorityStats = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => {
      const pTasks = allTasks.filter(t => t.priority === p);
      return {
        priority: p,
        total: pTasks.length,
        completed: pTasks.filter(t => t.status === 'COMPLETED').length,
        notCompleted: pTasks.filter(t => t.status === 'NOT_COMPLETED').length,
      };
    });

    // Reason analysis
    const reasonStats = {};
    allTasks.filter(t => t.reasonCategory).forEach(t => {
      reasonStats[t.reasonCategory] = (reasonStats[t.reasonCategory] || 0) + 1;
    });

    res.json({ weeklyTrend, dayOfWeekStats, hourStats, priorityStats, reasonStats });
  } catch (err) {
    console.error('Completion report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/reports/hours
router.get('/reports/hours', async (req, res) => {
  try {
    const now = new Date();
    const weekStart = new Date(now); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    const employees = await prisma.user.findMany({
      where: { role: 'EMPLOYEE', isActive: true },
      select: { id: true, name: true, department: true, avatarUrl: true },
    });

    const employeeHours = await Promise.all(employees.map(async (emp) => {
      const weekTasks = await prisma.task.findMany({
        where: { userId: emp.id, date: { gte: weekStart, lte: todayEnd }, status: 'COMPLETED' },
      });
      const monthTasks = await prisma.task.findMany({
        where: { userId: emp.id, date: { gte: monthStart, lte: todayEnd }, status: 'COMPLETED' },
      });

      const weekHours = weekTasks.reduce((s, t) => s + (t.actualHours || t.estimatedHours), 0);
      const monthHours = monthTasks.reduce((s, t) => s + (t.actualHours || t.estimatedHours), 0);

      // Check for overtime days (>9 hours)
      const dayHours = {};
      weekTasks.forEach(t => {
        const dateKey = t.date.toISOString().split('T')[0];
        dayHours[dateKey] = (dayHours[dateKey] || 0) + (t.actualHours || t.estimatedHours);
      });
      const overtimeDays = Object.entries(dayHours).filter(([_, h]) => h > 9).length;

      return {
        ...emp,
        weekHours: Math.round(weekHours * 10) / 10,
        monthHours: Math.round(monthHours * 10) / 10,
        avgDailyHours: Math.round((weekHours / 7) * 10) / 10,
        overtimeDays,
      };
    }));

    // Department hours
    const deptHours = {};
    employeeHours.forEach(e => {
      if (!deptHours[e.department]) deptHours[e.department] = 0;
      deptHours[e.department] += e.weekHours;
    });

    // Total company hours
    const totalWeekHours = employeeHours.reduce((s, e) => s + e.weekHours, 0);

    // 30-day trend
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const trendTasks = await prisma.task.findMany({
      where: { date: { gte: thirtyDaysAgo, lte: todayEnd }, status: 'COMPLETED' },
      select: { date: true, actualHours: true, estimatedHours: true },
    });

    const dailyTrend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
      const dateKey = d.toISOString().split('T')[0];
      const dayTasks = trendTasks.filter(t => t.date.toISOString().split('T')[0] === dateKey);
      dailyTrend.push({
        date: dateKey,
        hours: Math.round(dayTasks.reduce((s, t) => s + (t.actualHours || t.estimatedHours), 0) * 10) / 10,
      });
    }

    res.json({
      totalWeekHours: Math.round(totalWeekHours * 10) / 10,
      departmentHours: Object.entries(deptHours).map(([dept, hours]) => ({ department: dept, hours: Math.round(hours * 10) / 10 })).sort((a, b) => b.hours - a.hours),
      employeeHours: employeeHours.sort((a, b) => b.weekHours - a.weekHours),
      dailyTrend,
      topPerformers: employeeHours.sort((a, b) => b.monthHours - a.monthHours).slice(0, 5),
    });
  } catch (err) {
    console.error('Hours report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/reports/flagged
router.get('/reports/flagged', async (req, res) => {
  try {
    const { department, page = '1', limit = '25' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { status: 'NOT_COMPLETED' };
    
    if (department) {
      const deptUsers = await prisma.user.findMany({ where: { department }, select: { id: true } });
      where.userId = { in: deptUsers.map(u => u.id) };
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: { user: { select: { name: true, department: true } } },
        skip,
        take: parseInt(limit),
        orderBy: { date: 'desc' },
      }),
      prisma.task.count({ where }),
    ]);

    res.json({ tasks, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error('Flagged report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/tasks/:id/note
router.post('/tasks/:id/note', async (req, res) => {
  try {
    const { note } = req.body;
    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: { adminNote: note },
    });
    res.json({ task });
  } catch (err) {
    console.error('Admin note error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/tasks/:id/review
router.patch('/tasks/:id/review', async (req, res) => {
  try {
    const { resolved } = req.body;
    const data = { adminReviewed: true, reviewedAt: new Date() };
    if (resolved) data.resolvedAt = new Date();

    const task = await prisma.task.update({ where: { id: req.params.id }, data });

    await prisma.auditLog.create({
      data: { userId: req.user.userId, action: resolved ? 'TASK_RESOLVED' : 'TASK_REVIEWED', entity: 'Task', entityId: req.params.id },
    });

    res.json({ task });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
