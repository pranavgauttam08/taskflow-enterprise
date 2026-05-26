import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// GET /api/stats/me — personal dashboard stats
router.get('/me', async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();
    
    // Today's tasks
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const todayTasks = await prisma.task.findMany({
      where: { userId, date: { gte: todayStart, lte: todayEnd } },
      orderBy: { slotHour: 'asc' },
    });

    // This week's stats
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekTasks = await prisma.task.findMany({
      where: { userId, date: { gte: weekStart, lte: todayEnd } },
    });

    const weekCompleted = weekTasks.filter(t => t.status === 'COMPLETED').length;

    // This month's stats
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTasks = await prisma.task.findMany({
      where: { userId, date: { gte: monthStart, lte: todayEnd } },
    });

    const monthHours = monthTasks
      .filter(t => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + (t.actualHours || t.estimatedHours), 0);

    const monthTotal = monthTasks.length;
    const monthCompleted = monthTasks.filter(t => t.status === 'COMPLETED').length;
    const completionRate = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0;

    // Streak calculation
    let streak = 0;
    const checkDate = new Date(now);
    checkDate.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 365; i++) {
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayTasks = await prisma.task.findMany({
        where: {
          userId,
          date: { gte: dayStart, lte: dayEnd },
          status: 'COMPLETED',
        },
      });
      
      if (dayTasks.length === 0) {
        // Skip weekends in streak
        const dayOfWeek = checkDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Weekly activity (last 7 days)
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTasks = await prisma.task.findMany({
        where: { userId, date: { gte: day, lte: dayEnd } },
      });

      weeklyActivity.push({
        date: day.toISOString().split('T')[0],
        dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
        total: dayTasks.length,
        completed: dayTasks.filter(t => t.status === 'COMPLETED').length,
        hours: dayTasks.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + (t.actualHours || t.estimatedHours), 0),
      });
    }

    res.json({
      today: {
        tasks: todayTasks,
        total: todayTasks.length,
        completed: todayTasks.filter(t => t.status === 'COMPLETED').length,
        pending: todayTasks.filter(t => t.status === 'PENDING').length,
        notCompleted: todayTasks.filter(t => t.status === 'NOT_COMPLETED').length,
      },
      week: {
        total: weekTasks.length,
        completed: weekCompleted,
      },
      month: {
        total: monthTotal,
        completed: monthCompleted,
        hours: Math.round(monthHours * 10) / 10,
        completionRate,
      },
      streak,
      weeklyActivity,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/me/monthly?month=YYYY-MM
router.get('/me/monthly', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: 'Month parameter required' });

    const [year, mon] = month.split('-').map(Number);
    const startOfMonth = new Date(year, mon - 1, 1);
    const endOfMonth = new Date(year, mon, 0, 23, 59, 59, 999);
    const daysInMonth = new Date(year, mon, 0).getDate();

    const tasks = await prisma.task.findMany({
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      orderBy: [{ date: 'asc' }, { slotHour: 'asc' }],
    });

    // Daily breakdown
    const dailyData = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStart = new Date(year, mon - 1, d);
      const dateKey = dayStart.toISOString().split('T')[0];
      const dayTasks = tasks.filter(t => t.date.toISOString().split('T')[0] === dateKey);
      
      dailyData.push({
        date: dateKey,
        day: d,
        assigned: dayTasks.length,
        completed: dayTasks.filter(t => t.status === 'COMPLETED').length,
        notCompleted: dayTasks.filter(t => t.status === 'NOT_COMPLETED').length,
        pending: dayTasks.filter(t => t.status === 'PENDING').length,
        hours: dayTasks.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + (t.actualHours || t.estimatedHours), 0),
      });
    }

    // Priority breakdown
    const priorityBreakdown = {
      LOW: tasks.filter(t => t.priority === 'LOW').length,
      MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
      HIGH: tasks.filter(t => t.priority === 'HIGH').length,
      CRITICAL: tasks.filter(t => t.priority === 'CRITICAL').length,
    };

    res.json({
      month,
      totalTasks: tasks.length,
      totalCompleted: tasks.filter(t => t.status === 'COMPLETED').length,
      totalHours: tasks.filter(t => t.status === 'COMPLETED').reduce((s, t) => s + (t.actualHours || t.estimatedHours), 0),
      completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100) : 0,
      dailyData,
      priorityBreakdown,
      tasks,
    });
  } catch (err) {
    console.error('Monthly stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
