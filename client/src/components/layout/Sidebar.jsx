import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/calendar', icon: '📅', label: 'My Calendar' },
  { path: '/reports', icon: '📈', label: 'My Reports' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('') || '?';

  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="sidebar-brand">
        <div className="logo-icon">TF</div>
        <div className="brand-text">Task<span>Flow</span></div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
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
        <div className="avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{user?.name}</div>
          <div className="user-dept">
            <span className="status-dot online" />
            {user?.department}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
