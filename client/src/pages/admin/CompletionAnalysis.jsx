import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

const PRIORITY_COLORS = { LOW: '#6B7280', MEDIUM: '#5C4AE4', HIGH: '#F59E0B', CRITICAL: '#FF4D6D' };

export default function CompletionAnalysis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { data: res } = await api.get('/admin/reports/completion');
        setData(res);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  if (loading) return (
    <div>
      <div className="page-header"><div className="skeleton" style={{ width: 260, height: 28 }} /></div>
      <div className="two-col">{[1,2].map(i => <div key={i} className="skeleton" style={{ height: 300 }} />)}</div>
    </div>
  );

  if (!data) return null;

  const reasonData = Object.entries(data.reasonStats || {}).map(([name, value]) => ({ name, value }));
  const REASON_COLORS = ['#5C4AE4', '#FF4D6D', '#F59E0B', '#10D9A0', '#F2B94B', '#8892B0'];

  return (
    <div>
      <div className="page-header">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Completion Analysis</motion.h1>
        <p className="page-subtitle">Deep-dive into task completion patterns and trends</p>
      </div>

      <div className="two-col">
        {/* Weekly Completion Trend */}
        <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3>Completion Rate Trend (6 Months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.weeklyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="week" stroke="var(--text-muted)" fontSize={10} tickFormatter={w => w.slice(5)} />
              <YAxis stroke="var(--text-muted)" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Line type="monotone" dataKey="rate" name="Completion %" stroke="#10D9A0" strokeWidth={2} dot={false} animationDuration={1500} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Day of Week Radar */}
        <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3>Best vs Worst Days</h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={data.dayOfWeekStats}>
              <PolarGrid stroke="rgba(255,255,255,0.08)" />
              <PolarAngleAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} />
              <PolarRadiusAxis stroke="var(--text-muted)" fontSize={10} domain={[0, 100]} />
              <Radar name="Completion %" dataKey="rate" stroke="#5C4AE4" fill="#5C4AE4" fillOpacity={0.2} animationDuration={1200} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="two-col">
        {/* Priority Completion */}
        <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3>Completion by Priority</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.priorityStats} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="priority" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="completed" name="Completed" stackId="a" fill="#10D9A0" radius={[0, 0, 0, 0]} animationDuration={1200} />
              <Bar dataKey="notCompleted" name="Not Completed" stackId="a" fill="#FF4D6D" radius={[4, 4, 0, 0]} animationDuration={1200} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Reason Analysis */}
        <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3>Not-Completed Reasons</h3>
          {reasonData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={reasonData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false} animationDuration={1200}>
                  {reasonData.map((_, i) => <Cell key={i} fill={REASON_COLORS[i % REASON_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>No data available</p></div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {reasonData.map((r, i) => (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: REASON_COLORS[i % REASON_COLORS.length] }} />
                <span style={{ color: 'var(--text-muted)' }}>{r.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Peak Hours Heatmap */}
      <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h3>Peak Productivity Hours</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4, marginTop: '1rem' }}>
          {Object.values(data.hourStats || {}).filter(h => h.hour >= 8 && h.hour <= 19).map(h => {
            const maxH = Math.max(...Object.values(data.hourStats).map(x => x.completed), 1);
            const intensity = h.completed / maxH;
            return (
              <div key={h.hour} style={{ textAlign: 'center' }}>
                <div style={{
                  aspectRatio: '1', borderRadius: 'var(--radius-sm)',
                  background: intensity === 0 ? 'var(--surface-3)' : `rgba(92, 74, 228, ${0.15 + intensity * 0.85})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 600,
                  color: intensity > 0.4 ? 'white' : 'var(--text-muted)',
                }} title={`${h.completed} tasks completed at ${h.hour}:00`}>
                  {h.completed}
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>{h.hour}:00</div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
