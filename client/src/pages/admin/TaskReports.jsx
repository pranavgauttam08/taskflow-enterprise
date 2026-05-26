import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { DEPARTMENTS } from '../../utils/constants';
import { formatDate, formatDateISO } from '../../utils/dateUtils';
import StatusBadge from '../../components/ui/StatusBadge';

export default function TaskReports() {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', department: '', status: '', priority: '' });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const { data } = await api.get(`/admin/reports/tasks?${params}`);
      setTasks(data.tasks || []);
      setTotal(data.total || 0);
      setSummary(data.summary || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTasks(); }, [page]);

  const handleFilter = () => { setPage(1); fetchTasks(); };
  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="page-header">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Task Reports</motion.h1>
        <p className="page-subtitle">Comprehensive task data across the organization</p>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="input-group">
          <label>From</label>
          <input type="date" className="input" value={filters.dateFrom} onChange={e => setFilters(f => ({ ...f, dateFrom: e.target.value }))} />
        </div>
        <div className="input-group">
          <label>To</label>
          <input type="date" className="input" value={filters.dateTo} onChange={e => setFilters(f => ({ ...f, dateTo: e.target.value }))} />
        </div>
        <div className="input-group">
          <label>Department</label>
          <select className="input select" value={filters.department} onChange={e => setFilters(f => ({ ...f, department: e.target.value }))}>
            <option value="">All</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label>Status</label>
          <select className="input select" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="">All</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="NOT_COMPLETED">Not Completed</option>
          </select>
        </div>
        <div className="input-group">
          <label>Priority</label>
          <select className="input select" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            <option value="">All</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleFilter}>Apply</button>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: '1.5rem' }}>
        <div className="metric-card">
          <div className="metric-value">{total}</div>
          <div className="metric-label">Total Tasks</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{summary.completionRate || 0}%</div>
          <div className="metric-label">Completion Rate</div>
        </div>
      </div>

      {/* Table */}
      <motion.div className="chart-container" style={{ padding: 0, overflow: 'hidden' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Task</th>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16 }} /></td>)}</tr>
              )) : tasks.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><p>No tasks found with current filters</p></div></td></tr>
              ) : tasks.map(task => (
                <tr key={task.id}>
                  <td style={{ fontWeight: 500 }}>{task.user?.name || '—'}</td>
                  <td><span className="badge badge-accent">{task.user?.department}</span></td>
                  <td>
                    <div style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</div>
                  </td>
                  <td style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{formatDate(task.date)}</td>
                  <td style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{task.timeSlot}</td>
                  <td>
                    <span className={`badge ${task.priority === 'CRITICAL' ? 'badge-danger' : task.priority === 'HIGH' ? 'badge-warning' : 'badge-accent'}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td><StatusBadge status={task.status} /></td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {task.notCompletedReason || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => (
              <button key={i + 1} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
