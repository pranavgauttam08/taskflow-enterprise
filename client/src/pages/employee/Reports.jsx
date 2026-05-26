import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { formatMonth } from '../../utils/dateUtils';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import CircularProgress from '../../components/ui/CircularProgress';
import HoursAreaChart from '../../components/charts/HoursAreaChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const PRIORITY_COLORS = { LOW: '#6B7280', MEDIUM: '#5C4AE4', HIGH: '#F59E0B', CRITICAL: '#FF4D6D' };

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const [statsRes, monthRes] = await Promise.all([
          api.get('/stats/me'),
          api.get(`/stats/me/monthly?month=${formatMonth(new Date())}`),
        ]);
        setData({ stats: statsRes.data, monthly: monthRes.data });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  if (loading) return (
    <div>
      <div className="page-header"><div className="skeleton" style={{ width: 200, height: 28 }} /></div>
      <div className="stats-grid">{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 110 }} />)}</div>
    </div>
  );

  if (!data) return null;

  const { stats, monthly } = data;
  const priorityData = Object.entries(monthly.priorityBreakdown || {}).map(([name, value]) => ({ name, value }));

  // Weekly aggregation
  const weeklyData = [];
  for (let w = 0; w < 4; w++) {
    const start = w * 7;
    const end = Math.min(start + 7, monthly.dailyData?.length || 0);
    const week = (monthly.dailyData || []).slice(start, end);
    weeklyData.push({
      name: `Week ${w + 1}`,
      assigned: week.reduce((s, d) => s + d.assigned, 0),
      completed: week.reduce((s, d) => s + d.completed, 0),
    });
  }

  return (
    <div>
      <div className="page-header">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>My Reports</motion.h1>
        <p className="page-subtitle">Personal analytics and performance insights</p>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Tasks This Month', value: monthly.totalTasks, icon: '📋' },
          { label: 'Completion Rate', value: monthly.completionRate, icon: '🎯', suffix: '%' },
          { label: 'Total Hours', value: monthly.totalHours?.toFixed(1), icon: '⏱️' },
          { label: 'Current Streak', value: stats.streak, icon: '🔥', suffix: ' days' },
        ].map((card, i) => (
          <motion.div key={card.label} className="metric-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div className="metric-value"><AnimatedNumber value={parseFloat(card.value) || 0} />{card.suffix || ''}</div>
                <div className="metric-label">{card.label}</div>
              </div>
              <div className="metric-icon">{card.icon}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="two-col">
        <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3>Weekly Task Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }} />
              <Bar dataKey="assigned" name="Assigned" fill="#5C4AE4" radius={[4, 4, 0, 0]} animationDuration={1200} />
              <Bar dataKey="completed" name="Completed" fill="#10D9A0" radius={[4, 4, 0, 0]} animationDuration={1200} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3>Tasks by Priority</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                animationDuration={1200}
              >
                {priorityData.map((entry) => (
                  <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#5C4AE4'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <h3>Daily Hours Worked</h3>
        <HoursAreaChart data={monthly.dailyData || []} />
      </motion.div>
    </div>
  );
}
