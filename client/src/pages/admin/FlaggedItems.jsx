import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { DEPARTMENTS } from '../../utils/constants';
import { formatDate } from '../../utils/dateUtils';
import toast from 'react-hot-toast';

export default function FlaggedItems() {
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('');

  const fetchFlagged = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (department) params.set('department', department);
      const { data } = await api.get(`/admin/reports/flagged?${params}`);
      setTasks(data.tasks || []);
      setTotal(data.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFlagged(); }, [page, department]);

  const handleReview = async (taskId, resolved = false) => {
    try {
      await api.patch(`/admin/tasks/${taskId}/review`, { resolved });
      toast.success(resolved ? 'Marked as resolved' : 'Marked as reviewed');
      fetchFlagged();
    } catch { toast.error('Failed to update'); }
  };

  const handleNote = async (taskId) => {
    const note = prompt('Add admin note:');
    if (!note) return;
    try {
      await api.post(`/admin/tasks/${taskId}/note`, { note });
      toast.success('Note added');
      fetchFlagged();
    } catch { toast.error('Failed to add note'); }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div>
      <div className="page-header">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>🚩 Flagged Items</motion.h1>
        <p className="page-subtitle">{total} tasks marked as not completed</p>
      </div>

      <div className="filter-bar">
        <div className="input-group" style={{ minWidth: 180 }}>
          <label>Department</label>
          <select className="input select" value={department} onChange={e => { setDepartment(e.target.value); setPage(1); }}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <motion.div className="chart-container" style={{ padding: 0, overflow: 'hidden' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Task</th>
                <th>Date</th>
                <th>Reason Category</th>
                <th>Reason</th>
                <th>Admin Note</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><div className="skeleton" style={{ height: 16 }} /></td>)}</tr>
              )) : tasks.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-icon">✅</div>
                    <h3>No flagged items</h3>
                    <p>All tasks are on track!</p>
                  </div>
                </td></tr>
              ) : tasks.map(task => (
                <tr key={task.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{task.user?.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{task.user?.department}</div>
                  </td>
                  <td style={{ maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{task.title}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{formatDate(task.date)}</td>
                  <td><span className="badge badge-warning" style={{ fontSize: '0.6rem' }}>{task.reasonCategory || '—'}</span></td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={task.notCompletedReason}>
                    {task.notCompletedReason || '—'}
                  </td>
                  <td style={{ fontSize: '0.75rem', maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {task.adminNote || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    {task.resolvedAt ? <span className="badge badge-success">Resolved</span>
                      : task.adminReviewed ? <span className="badge badge-warning">Reviewed</span>
                      : <span className="badge badge-danger">Pending</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {!task.adminReviewed && <button className="btn btn-ghost btn-sm" onClick={() => handleReview(task.id)}>Review</button>}
                      {!task.resolvedAt && <button className="btn btn-ghost btn-sm" onClick={() => handleReview(task.id, true)} style={{ color: 'var(--success)' }}>Resolve</button>}
                      <button className="btn btn-ghost btn-sm" onClick={() => handleNote(task.id)}>📝</button>
                    </div>
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
