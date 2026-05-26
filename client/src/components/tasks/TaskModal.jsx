import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { TIME_SLOTS, PRIORITY_CONFIG } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function TaskModal({ date, task, onClose, onSave }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    timeSlot: task?.timeSlot || TIME_SLOTS[0]?.value || '',
    slotHour: task?.slotHour ?? TIME_SLOTS[0]?.hour ?? 8,
    priority: task?.priority || 'MEDIUM',
    estimatedHours: task?.estimatedHours || 1,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'timeSlot') {
      const slot = TIME_SLOTS.find(s => s.value === value);
      if (slot) setForm(prev => ({ ...prev, slotHour: slot.hour, timeSlot: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/tasks/${task.id}`, form);
        toast.success('Task updated');
      } else {
        await api.post('/tasks', { ...form, date });
        toast.success('Task created');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label>Task Title *</label>
            <input className="input" value={form.title} onChange={e => handleChange('title', e.target.value)} placeholder="Enter task title..." required />
          </div>

          <div className="input-group">
            <label>Description</label>
            <textarea className="input textarea" value={form.description} onChange={e => handleChange('description', e.target.value)} placeholder="Task details..." rows={3} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Time Slot</label>
              <select className="input select" value={form.timeSlot} onChange={e => handleChange('timeSlot', e.target.value)}>
                {TIME_SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div className="input-group">
              <label>Priority</label>
              <select className="input select" value={form.priority} onChange={e => handleChange('priority', e.target.value)}>
                {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="input-group">
            <label>Estimated Hours</label>
            <input className="input" type="number" min="0.5" max="8" step="0.5" value={form.estimatedHours} onChange={e => handleChange('estimatedHours', parseFloat(e.target.value))} />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
              {saving ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
