import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import CircularProgress from '../../components/ui/CircularProgress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DepartmentAnalytics() {
  const [departments, setDepartments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const { data } = await api.get('/admin/reports/departments');
        setDepartments(data.departments || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetch();
  }, []);

  if (loading) return (
    <div>
      <div className="page-header"><div className="skeleton" style={{ width: 250, height: 28 }} /></div>
      <div className="stats-grid">{[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 180 }} />)}</div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Department Analytics</motion.h1>
        <p className="page-subtitle">Performance breakdown by department</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {departments.map((dept, i) => (
          <motion.div
            key={dept.department}
            className="metric-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => setSelected(selected?.department === dept.department ? null : dept)}
            style={{ cursor: 'pointer', borderColor: selected?.department === dept.department ? 'var(--accent)' : undefined }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>{dept.department}</h3>
                <span className="badge badge-accent">{dept.employeeCount} employees</span>
              </div>
              <CircularProgress value={dept.completionRate} size={52} strokeWidth={4} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.75rem' }}>
              {[
                { label: 'Tasks', value: dept.totalTasks },
                { label: 'Done', value: dept.completed },
                { label: 'Hours', value: `${dept.hoursLogged}h` },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '1rem' }}>{s.value}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Comparison Chart */}
      <motion.div className="chart-container" style={{ marginTop: '2rem' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <h3>Department Performance Comparison</h3>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={departments} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="department" stroke="var(--text-muted)" fontSize={11} angle={-20} textAnchor="end" height={60} />
            <YAxis stroke="var(--text-muted)" fontSize={11} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.8rem' }} />
            <Bar dataKey="completionRate" name="Completion %" fill="#5C4AE4" radius={[6, 6, 0, 0]} animationDuration={1200} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
