import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import { REASON_CATEGORIES } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function StatusUpdateModal({ task, onClose, onUpdate }) {
  const [step, setStep] = useState('choose'); // choose | celebrate | reason
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    setSaving(true);
    try {
      await api.patch(`/tasks/${task.id}/status`, { status: 'COMPLETED' });
      setStep('celebrate');
      toast.success('Task marked as completed!');
      setTimeout(() => { onUpdate('COMPLETED'); }, 2500);
    } catch (err) {
      toast.error('Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const handleNotCompleted = async () => {
    if (reason.length < 20) {
      toast.error('Please provide at least 20 characters for the reason');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/tasks/${task.id}/status`, {
        status: 'NOT_COMPLETED',
        notCompletedReason: reason,
        reasonCategory: category,
      });
      toast.success('Status updated. Thank you for the update.');
      onUpdate('NOT_COMPLETED');
    } catch (err) {
      toast.error('Failed to update task');
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
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <AnimatePresence mode="wait">
          {step === 'choose' && (
            <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="modal-header">
                <h2>Update Task Status</h2>
                <button className="modal-close" onClick={onClose}>×</button>
              </div>
              <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{task.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{task.timeSlot}</div>
              </div>
              <div className="status-choice">
                <motion.div
                  className="choice-card completed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleComplete}
                  style={{ cursor: saving ? 'wait' : 'pointer' }}
                >
                  <div className="choice-icon">✅</div>
                  <div className="choice-label">Completed</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Task finished successfully</div>
                </motion.div>
                <motion.div
                  className="choice-card not-completed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep('reason')}
                >
                  <div className="choice-icon">❌</div>
                  <div className="choice-label">Not Completed</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Could not finish this task</div>
                </motion.div>
              </div>
            </motion.div>
          )}

          {step === 'celebrate' && (
            <motion.div
              key="celebrate"
              className="celebration-screen"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              <motion.div
                className="checkmark"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 10 }}
              >
                ✅
              </motion.div>
              <h2>Very good, keep it up! 🌟</h2>
              <p>Your dedication is noticed. Great work today.</p>
              <div style={{
                marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap'
              }}>
                {['🎉', '⭐', '🏆', '🚀', '💪'].map((emoji, i) => (
                  <motion.span
                    key={i}
                    style={{ fontSize: '1.5rem' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                  >
                    {emoji}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'reason' && (
            <motion.div key="reason" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <div className="modal-header">
                <h2>What prevented completion?</h2>
                <button className="modal-close" onClick={() => setStep('choose')}>←</button>
              </div>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label>Reason Category</label>
                <select className="input select" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="">Select a category...</option>
                  {REASON_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label>Detailed Reason</label>
                <textarea
                  className="input textarea"
                  placeholder="Please describe what prevented completion (min 20 characters)..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={4}
                />
                <div style={{ fontSize: '0.7rem', color: reason.length >= 20 ? 'var(--success)' : 'var(--text-muted)', textAlign: 'right' }}>
                  {reason.length}/20 min characters
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleNotCompleted}
                disabled={saving || reason.length < 20}
                style={{ width: '100%' }}
              >
                {saving ? 'Submitting...' : 'Submit Reason'}
              </button>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '1rem' }}>
                Thank you for the update. We'll review and support you.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
