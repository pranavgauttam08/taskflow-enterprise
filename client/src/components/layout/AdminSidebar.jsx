import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/admin', icon: '🏠', label: 'Overview', exact: true },
  { path: '/admin/employees', icon: '👥', label: 'Employees' },
  { path: '/admin/reports', icon: '📋', label: 'Task Reports' },
  { path: '/admin/departments', icon: '🏢', label: 'Departments' },
  { path: '/admin/hours', icon: '⏱️', label: 'Hours Tracker' },
  { path: '/admin/completion', icon: '📊', label: 'Completion Analysis' },
  { path: '/admin/flagged', icon: '🚩', label: 'Flagged Items' },
  { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
];

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <motion.aside
      className="sidebar"
      style={{ width: 280 }}
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="sidebar-brand">
        <div className="logo-icon">TF</div>
        <div className="brand-text">
          Task<span>Flow</span>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 400, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            Admin Console
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div style={{ flex: 1 }} />

        <button
          onClick={handleLogout}
          className="nav-item"
          style={{ border: 'none', background: 'transparent', width: '100%', textAlign: 'left', fontFamily: 'inherit', fontSize: 'inherit' }}
        >
          <span className="nav-icon">🚪</span>
          <span>Logout</span>
        </button>
      </nav>

      <div className="sidebar-user">
        <div className="avatar" style={{ background: 'linear-gradient(135deg, #F2B94B, #5C4AE4)' }}>AM</div>
        <div className="user-info">
          <div className="user-name">{user?.name || 'Alex Morgan'}</div>
          <div className="user-dept">
            <span className="status-dot online" />
            Administrator
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
