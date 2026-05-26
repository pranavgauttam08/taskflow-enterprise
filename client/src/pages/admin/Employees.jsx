import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { DEPARTMENTS } from '../../utils/constants';
import { formatDate } from '../../utils/dateUtils';
import StatusBadge from '../../components/ui/StatusBadge';
import CircularProgress from '../../components/ui/CircularProgress';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [empDetail, setEmpDetail] = useState(null);
  const [empTasks, setEmpTasks] = useState([]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (search) params.set('search', search);
      if (department) params.set('department', department);
      const { data } = await api.get(`/admin/employees?${params}`);
      setEmployees(data.employees || []);
      setTotal(data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEmployees(); }, [page, department]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  const openDetail = async (emp) => {
    setSelected(emp);
    try {
      const [detailRes, tasksRes] = await Promise.all([
        api.get(`/admin/employees/${emp.id}`),
        api.get(`/admin/employees/${emp.id}/tasks?limit=15`),
      ]);
      setEmpDetail(detailRes.data);
      setEmpTasks(tasksRes.data.tasks || []);
    } catch {}
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div>
      <div className="page-header">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Employee Management</motion.h1>
        <p className="page-subtitle">{total} employees in the organization</p>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', flex: 1, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ flex: 1, minWidth: 200 }}>
            <label>Search</label>
            <input className="input" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="input-group" style={{ minWidth: 150 }}>
            <label>Department</label>
            <select className="input select" value={department} onChange={e => { setDepartment(e.target.value); setPage(1); }}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>
      </div>

      {/* Table */}
      <motion.div className="chart-container" style={{ padding: 0, overflow: 'hidden' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Tasks This Month</th>
                <th>Completion Rate</th>
                <th>Hours Logged</th>
                <th>Last Active</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 16, width: '80%' }} /></td>
                    ))}
                  </tr>
                ))
              ) : employees.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><p>No employees found</p></div></td></tr>
              ) : employees.map((emp, i) => (
                <motion.tr
                  key={emp.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => openDetail(emp)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent), var(--gold))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 700, color: 'white', flexShrink: 0,
                      }}>
                        {emp.name?.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{emp.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-accent">{emp.department}</span></td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{emp.tasksThisMonth}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CircularProgress value={emp.completionRate} size={28} strokeWidth={3} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{emp.completionRate}%</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{emp.hoursLogged}h</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {emp.lastLogin ? formatDate(emp.lastLogin) : 'Never'}
                  </td>
                  <td>
                    <span className={`status-dot ${emp.isActive ? 'online' : 'offline'}`} />
                    <span style={{ marginLeft: 6, fontSize: '0.8rem' }}>{emp.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
              <button key={i + 1} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        )}
      </motion.div>

      {/* Employee Detail Drawer */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} style={{ background: 'rgba(0,0,0,0.5)' }} />
            <motion.div className="drawer" initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }} transition={{ type: 'spring', damping: 25 }}>
              <div className="drawer-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: 'white' }}>
                    {selected.name?.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.1rem' }}>{selected.name}</h2>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selected.email} · {selected.department}</div>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setSelected(null)}>×</button>
              </div>
              <div className="drawer-body">
                {empDetail && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                      {[
                        { label: 'Total Tasks', value: empDetail.stats.totalTasks },
                        { label: 'Completed', value: empDetail.stats.totalCompleted },
                        { label: 'Completion Rate', value: `${empDetail.stats.completionRate}%` },
                        { label: 'Hours Logged', value: `${empDetail.stats.totalHours}h` },
                      ].map(s => (
                        <div key={s.label} style={{ padding: '0.75rem', background: 'var(--card)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem' }}>{s.value}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    <h3 style={{ marginBottom: '0.75rem' }}>Recent Tasks</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      {empTasks.map(task => (
                        <div key={task.id} style={{
                          padding: '0.625rem 0.75rem', borderRadius: 'var(--radius)',
                          background: 'var(--surface)', border: '1px solid var(--border)',
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{task.title}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{formatDate(task.date)} · {task.timeSlot}</div>
                          </div>
                          <StatusBadge status={task.status} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
