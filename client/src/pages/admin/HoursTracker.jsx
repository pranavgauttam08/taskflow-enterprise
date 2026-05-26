import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function HoursTracker() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { data: res } = await api.get('/admin/reports/hours');
        setData(res);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  if (loading) return (
    <div>
      <div className="page-header"><div className="skeleton" style={{ width: 200, height: 28 }} /></div>
      <div className="skeleton" style={{ height: 120, marginBottom: 16 }} />
      <div className="two-col"><div className="skeleton" style={{ height: 300 }} /><div className="skeleton" style={{ height: 300 }} /></div>
    </div>
  );

  if (!data) return null;

  return (
    <div>
      <div className="page-header">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Hours Tracker</motion.h1>
        <p className="page-subtitle">Company-wide hours and productivity monitoring</p>
      </div>

      {/* Hero Number */}
      <motion.div className="metric-card" style={{ textAlign: 'center', marginBottom: '2rem' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', fontWeight: 800, background: 'linear-gradient(135deg, var(--accent-bright), var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          <AnimatedNumber value={data.totalWeekHours} />h
        </div>
        <div className="metric-label">Total Company Hours This Week</div>
      </motion.div>

      <div className="two-col">
        {/* Department Hours */}
        <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3>Hours by Department</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.departmentHours} layout="vertical" margin={{ top: 10, right: 20, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
              <YAxis dataKey="department" type="category" stroke="var(--text-muted)" fontSize={11} width={80} />
              <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="hours" name="Hours" fill="#5C4AE4" radius={[0, 6, 6, 0]} animationDuration={1200} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Top Performers */}
        <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3>🏆 Most Dedicated This Month</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
            {(data.topPerformers || []).slice(0, 5).map((emp, i) => (
              <div key={emp.id} style={{
                display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem',
                background: i === 0 ? 'linear-gradient(135deg, rgba(242,185,75,0.1), rgba(92,74,228,0.05))' : 'var(--surface)',
                borderRadius: 'var(--radius)', border: `1px solid ${i === 0 ? 'var(--gold)' : 'var(--border)'}`,
              }}>
                <div style={{ fontSize: '1.5rem' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</div>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'white' }}>
                  {emp.name?.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{emp.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.department}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '1rem', color: 'var(--gold)' }}>
                  {emp.monthHours}h
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Trend Chart */}
      <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h3>30-Day Hours Trend</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data.dailyTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5C4AE4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#5C4AE4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={10} tickFormatter={d => d.slice(5)} />
            <YAxis stroke="var(--text-muted)" fontSize={11} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
            <Area type="monotone" dataKey="hours" stroke="#5C4AE4" fill="url(#hoursGrad)" strokeWidth={2} dot={false} animationDuration={1500} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Employee Hours Table */}
      <motion.div className="chart-container" style={{ padding: 0, overflow: 'hidden', marginTop: '1.5rem' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}><h3>Employee Hours Breakdown</h3></div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Employee</th><th>Department</th><th>This Week</th><th>This Month</th><th>Avg Daily</th><th>Overtime</th></tr>
            </thead>
            <tbody>
              {(data.employeeHours || []).map(emp => (
                <tr key={emp.id}>
                  <td style={{ fontWeight: 500 }}>{emp.name}</td>
                  <td><span className="badge badge-accent">{emp.department}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{emp.weekHours}h</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{emp.monthHours}h</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{emp.avgDailyHours}h</td>
                  <td>
                    {emp.overtimeDays > 0 ? (
                      <span className="badge badge-warning">{emp.overtimeDays} days</span>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
