import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { formatDateISO, formatMonthLabel, getCalendarDays, formatDateFull } from '../../utils/dateUtils';
import { STATUS_CONFIG, TIME_SLOTS } from '../../utils/constants';
import StatusBadge from '../../components/ui/StatusBadge';
import CircularProgress from '../../components/ui/CircularProgress';
import TaskModal from '../../components/tasks/TaskModal';
import StatusUpdateModal from '../../components/tasks/StatusUpdateModal';
import toast from 'react-hot-toast';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthData, setMonthData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [dayTasks, setDayTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(null); // { date, task? }
  const [statusModal, setStatusModal] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const fetchMonth = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/tasks/month?month=${monthStr}`);
      setMonthData(data.grouped || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [monthStr]);

  useEffect(() => { fetchMonth(); }, [fetchMonth]);

  const fetchDay = async (dateStr) => {
    try {
      const { data } = await api.get(`/tasks?date=${dateStr}`);
      setDayTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDateClick = (day) => {
    const dateStr = day.dateStr;
    setSelectedDate(day);
    fetchDay(dateStr);
  };

  const handlePrev = () => setCurrentDate(new Date(year, month - 1));
  const handleNext = () => setCurrentDate(new Date(year, month + 1));

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      fetchDay(selectedDate.dateStr);
      fetchMonth();
    } catch { toast.error('Failed to delete'); }
  };

  const days = getCalendarDays(year, month);

  return (
    <div>
      <div className="page-header">
        <h1>My Calendar</h1>
        <p className="page-subtitle">Manage your daily tasks and track progress</p>
      </div>

      {/* Month Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <motion.button className="btn btn-ghost" onClick={handlePrev} whileTap={{ scale: 0.95 }}>← Previous</motion.button>
        <motion.h2
          key={monthStr}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {formatMonthLabel(currentDate)}
        </motion.h2>
        <motion.button className="btn btn-ghost" onClick={handleNext} whileTap={{ scale: 0.95 }}>Next →</motion.button>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {WEEKDAYS.map(day => (
          <div key={day} className="calendar-header-cell">{day}</div>
        ))}
        {days.map((day, i) => {
          const dateTasks = monthData[day.dateStr] || [];
          const total = dateTasks.length;
          const completed = dateTasks.filter(t => t.status === 'COMPLETED').length;
          const hasIncomplete = dateTasks.some(t => t.status === 'NOT_COMPLETED');
          const allDone = total > 0 && completed === total;
          const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <motion.div
              key={day.dateStr}
              className={`calendar-cell ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''} ${allDone ? 'all-complete' : ''} ${hasIncomplete ? 'has-incomplete' : ''}`}
              onClick={() => day.isCurrentMonth && handleDateClick(day)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.01 }}
              whileHover={{ scale: 1.03 }}
            >
              <div className="day-number">{day.dayOfMonth}</div>
              {total > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 'auto' }}>
                    <span className="badge badge-accent" style={{ padding: '1px 6px', fontSize: '0.6rem' }}>{total}</span>
                    <CircularProgress value={rate} size={20} strokeWidth={2} />
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Day Detail Drawer */}
      <AnimatePresence>
        {selectedDate && (
          <>
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedDate(null)}
              style={{ background: 'rgba(0,0,0,0.5)' }}
            />
            <motion.div
              className="drawer"
              initial={{ x: 500 }} animate={{ x: 0 }} exit={{ x: 500 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="drawer-header">
                <div>
                  <h2 style={{ fontSize: '1.1rem' }}>{formatDateFull(selectedDate.date)}</h2>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {dayTasks.length} tasks · {dayTasks.filter(t => t.status === 'COMPLETED').length} completed
                  </div>
                </div>
                <button className="modal-close" onClick={() => setSelectedDate(null)}>×</button>
              </div>
              <div className="drawer-body">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => setTaskModal({ date: selectedDate.dateStr })}>
                    + Add Task
                  </button>
                </div>

                {dayTasks.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h3>No tasks for this day</h3>
                    <p>Click "Add Task" to get started</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {dayTasks.map(task => (
                      <motion.div
                        key={task.id}
                        className="timeline-item"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ flexDirection: 'column', gap: '0.5rem' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                          <span className="time-badge">{task.timeSlot}</span>
                          <div style={{ flex: 1 }}>
                            <div className="task-title">{task.title}</div>
                            {task.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.description.substring(0, 80)}</div>}
                          </div>
                          <StatusBadge status={task.status} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          {task.status === 'PENDING' && (
                            <button className="btn btn-primary btn-sm" onClick={() => setStatusModal(task)}>Update Status</button>
                          )}
                          <button className="btn btn-ghost btn-sm" onClick={() => setTaskModal({ date: selectedDate.dateStr, task })}>✏️ Edit</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteTask(task.id)} style={{ color: 'var(--danger)' }}>🗑</button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Task Modal */}
      {taskModal && (
        <TaskModal
          date={taskModal.date}
          task={taskModal.task}
          onClose={() => setTaskModal(null)}
          onSave={() => { setTaskModal(null); fetchDay(selectedDate.dateStr); fetchMonth(); }}
        />
      )}

      {/* Status Update Modal */}
      {statusModal && (
        <StatusUpdateModal
          task={statusModal}
          onClose={() => setStatusModal(null)}
          onUpdate={() => { setStatusModal(null); fetchDay(selectedDate.dateStr); fetchMonth(); }}
        />
      )}
    </div>
  );
}
