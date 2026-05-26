import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import AnimatedNumber from '../../components/ui/AnimatedNumber';
import CircularProgress from '../../components/ui/CircularProgress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import AnimatedBarChart3D from '../../components/3d/AnimatedBarChart3D';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function Overview() {
  const { user } = useAuth();
  const { on } = useSocket(user);
  const [overview, setOverview] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lbMetric, setLbMetric] = useState('completed');
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    async function fetch() {
      try {
        const [ovRes, lbRes, deptRes] = await Promise.all([
          api.get('/admin/reports/overview'),
          api.get('/admin/reports/leaderboard?metric=completed'),
          api.get('/admin/reports/departments'),
        ]);
        setOverview(ovRes.data);
        setLeaderboard(lbRes.data.leaderboard || []);
        setDepartments(deptRes.data.departments || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); setLastUpdate(Date.now()); }
    }
    fetch();
  }, []);

  useEffect(() => {
    const unbind = on('task-updated', () => {
      // Re-fetch when tasks update
      async function fetchUpdate() {
        try {
          const [ovRes, lbRes, deptRes] = await Promise.all([
            api.get('/admin/reports/overview'),
            api.get(`/admin/reports/leaderboard?metric=${lbMetric}`),
            api.get('/admin/reports/departments'),
          ]);
          setOverview(ovRes.data);
          setLeaderboard(lbRes.data.leaderboard || []);
          setDepartments(deptRes.data.departments || []);
          setLastUpdate(Date.now());
        } catch (err) {}
      }
      fetchUpdate();
    });
    return () => { if (unbind) unbind(); };
  }, [on, lbMetric]);

  const switchMetric = async (metric) => {
    setLbMetric(metric);
    try {
      const { data } = await api.get(`/admin/reports/leaderboard?metric=${metric}`);
      setLeaderboard(data.leaderboard || []);
    } catch {}
  };

  if (loading) return <OverviewSkeleton />;

  const kpis = [
    { label: 'Active Employees', value: overview?.totalEmployees || 0, icon: '👥', color: 'var(--accent)' },
    { label: 'Tasks Created Today', value: overview?.tasksCreatedToday || 0, icon: '📋', color: 'var(--accent-bright)' },
    { label: 'Tasks Completed Today', value: overview?.tasksCompletedToday || 0, icon: '✅', color: 'var(--success)' },
    { label: 'Completion Rate', value: overview?.companyCompletionRate || 0, icon: '🎯', color: 'var(--gold)', suffix: '%' },
    { label: 'Hours This Week', value: overview?.weekHoursLogged || 0, icon: '⏱️', color: 'var(--accent)' },
    { label: 'Flagged Tasks', value: overview?.flaggedTasks || 0, icon: '🚩', color: 'var(--danger)' },
  ];

  const atRisk = leaderboard.filter(e => e.completionRate < 60);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Admin Command Center</motion.h1>
          <p className="page-subtitle">Company-wide task management overview</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--surface)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
          <div className="status-dot online" />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live Updates</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} className="metric-card" custom={i} initial="hidden" animate="visible" variants={cardVariants}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="metric-value"><AnimatedNumber value={kpi.value} />{kpi.suffix || ''}</div>
                <div className="metric-label">{kpi.label}</div>
              </div>
              <div className="metric-icon" style={{ background: `${kpi.color}20`, color: kpi.color }}>{kpi.icon}</div>
            </div>
            {kpi.label === 'Completion Rate' && (
              <div style={{ position: 'absolute', bottom: 12, right: 16, opacity: 0.5 }}>
                <CircularProgress value={kpi.value} size={44} strokeWidth={4} />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Three Column Grid */}
      <div className="three-col">
        {/* Top Performers */}
        <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Top Performers</h3>
            <select
              className="input select"
              style={{ width: 'auto', padding: '0.25rem 2rem 0.25rem 0.5rem', fontSize: '0.7rem' }}
              value={lbMetric}
              onChange={e => switchMetric(e.target.value)}
            >
              <option value="completed">Most Tasks</option>
              <option value="rate">Best Rate</option>
              <option value="hours">Most Hours</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {leaderboard.slice(0, 8).map((emp, i) => (
              <div key={emp.id} className="leaderboard-item">
                <div className={`rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'default'}`}>{i + 1}</div>
                <div className="avatar" style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {emp.name?.split(' ').map(n => n[0]).join('')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.department}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                    {lbMetric === 'rate' ? `${emp.completionRate}%` : lbMetric === 'hours' ? `${emp.hoursLogged}h` : emp.tasksCompleted}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* At-Risk Employees */}
        <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h3>⚠️ At-Risk Employees</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Completion rate &lt; 60% this week</p>
          {atRisk.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <div className="empty-icon">🎉</div>
              <h3 style={{ fontSize: '0.9rem' }}>All employees on track!</h3>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {atRisk.map(emp => (
                <div key={emp.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius)', background: 'var(--danger-bg)', border: '1px solid rgba(255,77,109,0.1)',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{emp.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.department}</div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
                    {emp.completionRate}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Department Quick View */}
        <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <h3>Department Overview</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            {departments.map(dept => (
              <div key={dept.department} style={{
                padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{dept.department}</div>
                  <span className="badge badge-accent">{dept.employeeCount} people</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
                    <motion.div
                      style={{
                        height: '100%', borderRadius: 3,
                        background: dept.completionRate >= 80 ? 'var(--success)' : dept.completionRate >= 50 ? 'var(--warning)' : 'var(--danger)',
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${dept.completionRate}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, fontFamily: 'var(--font-mono)', minWidth: 36 }}>
                    {dept.completionRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Department Comparison Chart */}
      <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Department Completion (3D View)</h3>
        </div>
        <AnimatedBarChart3D 
          data={departments.map(d => ({ 
            label: d.department.substring(0,3).toUpperCase(), 
            value: d.completionRate,
            color: d.completionRate >= 80 ? '#10D9A0' : d.completionRate >= 50 ? '#F59E0B' : '#FF4D6D'
          }))} 
        />
      </motion.div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div className="skeleton" style={{ width: 300, height: 32, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: 240, height: 16 }} />
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton" style={{ height: 110 }} />)}
      </div>
      <div className="three-col" style={{ marginTop: '1.5rem' }}>
        {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 350 }} />)}
      </div>
    </div>
  );
}
