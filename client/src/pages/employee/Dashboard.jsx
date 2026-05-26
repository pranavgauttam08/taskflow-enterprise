import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import { STATUS_CONFIG } from '../../utils/constants';
import { formatDateISO, formatMonth } from '../../utils/dateUtils';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import CircularProgress from '../../components/ui/CircularProgress';
import StatusBadge from '../../components/ui/StatusBadge';
import SparklineBar from '../../components/charts/SparklineBar';
import HoursAreaChart from '../../components/charts/HoursAreaChart';
import ActivityHeatmap from '../../components/charts/ActivityHeatmap';
import StatusUpdateModal from '../../components/tasks/StatusUpdateModal';
import CompletionTorus from '../../components/3d/CompletionTorus';
import CelebrationBurst from '../../components/3d/CelebrationBurst';
import { useSocket } from '../../hooks/useSocket';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: [0.4, 0, 0.2, 1] } }),
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const { on } = useSocket(user);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, monthlyRes] = await Promise.all([
        api.get('/stats/me'),
        api.get(`/stats/me/monthly?month=${formatMonth(new Date())}`),
      ]);
      setStats(statsRes.data);
      setMonthlyData(monthlyRes.data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const unbind = on('task-updated', () => {
      fetchData();
    });
    return () => {
      if (unbind) unbind();
    };
  }, [on, fetchData]);

  if (loading) return <DashboardSkeleton />;

  const todayTasks = stats?.today?.tasks || [];
  const weekActivity = stats?.weeklyActivity || [];

  return (
    <div>
      <div className="page-header">
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </motion.h1>
        <p className="page-subtitle">Here's your productivity overview for today</p>
      </div>

      {/* Hero Stats */}
      <div className="stats-grid">
        {[
          { label: 'Tasks Today', value: stats?.today?.total || 0, icon: '📋', extra: `${stats?.today?.completed || 0} completed` },
          { label: 'Completed This Week', value: stats?.week?.completed || 0, icon: '✅', sparkline: weekActivity.map(d => d.completed) },
          { label: 'Hours This Month', value: stats?.month?.hours || 0, icon: '⏱️', suffix: 'h' },
          { label: 'Completion Rate', value: stats?.month?.completionRate || 0, icon: '🎯', isPercent: true },
        ].map((card, i) => (
          <motion.div key={card.label} className="metric-card" custom={i} initial="hidden" animate="visible" variants={cardVariants}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="metric-value">
                  <AnimatedNumber value={card.value} />{card.suffix || ''}{card.isPercent ? '%' : ''}
                </div>
                <div className="metric-label">{card.label}</div>
                {card.extra && <div style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.5rem' }}>{card.extra}</div>}
              </div>
              <div className="metric-icon">{card.icon}</div>
            </div>
            {card.sparkline && (
              <div style={{ marginTop: '0.75rem' }}>
                <SparklineBar data={card.sparkline} />
              </div>
            )}
            {card.isPercent && (
              <div style={{ position: 'absolute', bottom: -20, right: -20 }}>
                <CompletionTorus rate={card.value} size="120px" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Middle: Timeline + Heatmap */}
      <div className="two-col">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="chart-container">
            <h3>Today's Task Timeline</h3>
            {todayTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No tasks for today</h3>
                <p>Head to your calendar to add tasks</p>
              </div>
            ) : (
              <div className="timeline">
                {todayTasks.map((task, i) => (
                  <motion.div
                    key={task.id}
                    className="timeline-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    onClick={() => task.status === 'PENDING' && setSelectedTask(task)}
                    style={{ cursor: task.status === 'PENDING' ? 'pointer' : 'default' }}
                  >
                    <div className="time-badge">{task.timeSlot}</div>
                    <div className="task-info">
                      <div className="task-title">{task.title}</div>
                      {task.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.description.substring(0, 60)}</div>}
                    </div>
                    <StatusBadge status={task.status} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="chart-container">
            <h3>Weekly Activity</h3>
            <ActivityHeatmap data={weekActivity} />
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🔥</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem' }}>{stats?.streak || 0} Day Streak</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Keep it up!</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom: Monthly Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <div className="chart-container">
          <h3>Monthly Performance</h3>
          {monthlyData && <HoursAreaChart data={monthlyData.dailyData} />}
        </div>
      </motion.div>

      {/* Status Update Modal */}
      {selectedTask && (
        <StatusUpdateModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(status) => { 
            setSelectedTask(null); 
            fetchData();
            if (status === 'COMPLETED') {
              setShowCelebration(true);
              setTimeout(() => setShowCelebration(false), 3500);
            }
          }}
        />
      )}

      {/* 3D Celebration Burst */}
      {showCelebration && <CelebrationBurst />}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div className="skeleton" style={{ width: 300, height: 32, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 220, height: 16 }} />
      </div>
      <div className="stats-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton" style={{ height: 130, borderRadius: 'var(--radius-lg)' }} />
        ))}
      </div>
      <div className="two-col" style={{ marginTop: '1.5rem' }}>
        <div className="skeleton" style={{ height: 350, borderRadius: 'var(--radius-lg)' }} />
        <div className="skeleton" style={{ height: 350, borderRadius: 'var(--radius-lg)' }} />
      </div>
    </div>
  );
}
