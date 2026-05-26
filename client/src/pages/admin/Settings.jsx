import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import { DEPARTMENTS } from '../../utils/constants';
import toast from 'react-hot-toast';

export default function Settings() {
  const [newEmp, setNewEmp] = useState({ name: '', email: '', department: '', password: '' });
  const [creating, setCreating] = useState(false);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.email || !newEmp.department || !newEmp.password) {
      toast.error('All fields are required');
      return;
    }
    setCreating(true);
    try {
      await api.post('/admin/employees', newEmp);
      toast.success(`Employee ${newEmp.name} created successfully!`);
      setNewEmp({ name: '', email: '', department: '', password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create employee');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Settings</motion.h1>
        <p className="page-subtitle">Platform configuration and employee management</p>
      </div>

      <div className="two-col">
        {/* Create Employee */}
        <motion.div className="chart-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3>Create New Employee</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Add a new team member to the platform.
          </p>
          <form onSubmit={handleCreateEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label>Full Name</label>
              <input className="input" placeholder="John Doe" value={newEmp.name} onChange={e => setNewEmp(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input className="input" type="email" placeholder="john.doe@taskflow.io" value={newEmp.email} onChange={e => setNewEmp(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="input-group">
              <label>Department</label>
              <select className="input select" value={newEmp.department} onChange={e => setNewEmp(p => ({ ...p, department: e.target.value }))} required>
                <option value="">Select department...</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Temporary Password</label>
              <input className="input" type="password" placeholder="Min 8 characters" value={newEmp.password} onChange={e => setNewEmp(p => ({ ...p, password: e.target.value }))} minLength={8} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={creating}>
              {creating ? 'Creating...' : 'Create Employee'}
            </button>
          </form>
        </motion.div>

        {/* Company Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="chart-container" style={{ marginBottom: '1.5rem' }}>
            <h3>Company Profile</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div className="input-group">
                <label>Company Name</label>
                <input className="input" value="TaskFlow Enterprise" disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="input-group">
                <label>Timezone</label>
                <input className="input" value={Intl.DateTimeFormat().resolvedOptions().timeZone} disabled style={{ opacity: 0.6 }} />
              </div>
            </div>
          </div>

          <div className="chart-container">
            <h3>Notification Settings</h3>
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Daily task reminder (9 AM)', enabled: true },
                { label: 'End-of-day pending alert (6 PM)', enabled: true },
                { label: 'Weekly performance digest (Monday)', enabled: false },
                { label: 'Alert on 2+ days no tasks logged', enabled: true },
                { label: 'Alert on completion rate < 50%', enabled: true },
              ].map((setting, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem 1rem', borderRadius: 'var(--radius)',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '0.85rem' }}>{setting.label}</span>
                  <div style={{
                    width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                    background: setting.enabled ? 'var(--accent)' : 'var(--surface-3)',
                    position: 'relative', transition: 'background 0.2s',
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', background: 'white',
                      position: 'absolute', top: 3,
                      left: setting.enabled ? 23 : 3,
                      transition: 'left 0.2s',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
