import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user, checkAuth } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const initials = user?.name?.split(' ').map(n => n[0]).join('') || '?';

  const handleSave = async () => {
    setSaving(true);
    try {
      toast.success('Profile updated (display only)');
      setEditing(false);
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>My Profile</motion.h1>
        <p className="page-subtitle">Your personal information and settings</p>
      </div>

      <div className="two-col">
        <motion.div className="glass-card" style={{ padding: '2rem' }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%', margin: '0 auto 1rem',
              background: 'linear-gradient(135deg, var(--accent), var(--gold))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontWeight: 700, color: 'white',
              fontFamily: 'var(--font-display)',
              boxShadow: '0 8px 32px rgba(92, 74, 228, 0.3)',
            }}>
              {initials}
            </div>
            <h2>{user?.name}</h2>
            <p style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            <span className="badge badge-accent" style={{ marginTop: '0.5rem', display: 'inline-block' }}>{user?.department}</span>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="input-group">
              <label>Full Name</label>
              <input className="input" value={editing ? name : user?.name} onChange={e => setName(e.target.value)} disabled={!editing} />
            </div>
            <div className="input-group">
              <label>Email</label>
              <input className="input" value={user?.email} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="input-group">
              <label>Department</label>
              <input className="input" value={user?.department} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="input-group">
              <label>Role</label>
              <input className="input" value={user?.role} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="input-group">
              <label>Member Since</label>
              <input className="input" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'} disabled style={{ opacity: 0.6 }} />
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            {editing ? (
              <>
                <button className="btn btn-ghost" onClick={() => setEditing(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button className="btn btn-primary" onClick={() => setEditing(true)} style={{ flex: 1 }}>Edit Profile</button>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="chart-container" style={{ marginBottom: '1.5rem' }}>
            <h3>Quick Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              {[
                { label: 'Total Tasks', value: '—', icon: '📋' },
                { label: 'Completed', value: '—', icon: '✅' },
                { label: 'Hours Logged', value: '—', icon: '⏱️' },
                { label: 'Best Streak', value: '—', icon: '🔥' },
              ].map(stat => (
                <div key={stat.label} style={{
                  padding: '1rem', background: 'var(--surface)', borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.25rem' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-container">
            <h3>Account Security</h3>
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Password</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Last changed: N/A</div>
                </div>
                <button className="btn btn-ghost btn-sm">Change</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Last Login</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Current session'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
