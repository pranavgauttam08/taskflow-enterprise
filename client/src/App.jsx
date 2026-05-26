import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Sidebar from './components/layout/Sidebar';
import AdminSidebar from './components/layout/AdminSidebar';

/* ---- Lazy-loaded pages (code-split per route) ---- */
const Login = lazy(() => import('./pages/Login'));
const EmployeeDashboard = lazy(() => import('./pages/employee/Dashboard'));
const EmployeeCalendar = lazy(() => import('./pages/employee/Calendar'));
const EmployeeReports = lazy(() => import('./pages/employee/Reports'));
const EmployeeProfile = lazy(() => import('./pages/employee/Profile'));
const AdminOverview = lazy(() => import('./pages/admin/Overview'));
const AdminEmployees = lazy(() => import('./pages/admin/Employees'));
const AdminTaskReports = lazy(() => import('./pages/admin/TaskReports'));
const AdminDepartments = lazy(() => import('./pages/admin/DepartmentAnalytics'));
const AdminHours = lazy(() => import('./pages/admin/HoursTracker'));
const AdminCompletion = lazy(() => import('./pages/admin/CompletionAnalysis'));
const AdminFlagged = lazy(() => import('./pages/admin/FlaggedItems'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));

/* ---- Lazy-loaded 3D background (heavy ~600KB Three.js) ---- */
const ParticleField = lazy(() => import('./components/3d/ParticleField'));

/* ---- Loading Screens ---- */
function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 44, height: 44,
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 1rem',
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-body)' }}>Loading TaskFlow...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 32, height: 32,
          border: '3px solid var(--border)',
          borderTopColor: 'var(--accent-bright)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          margin: '0 auto 0.75rem',
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ---- Protected Route ---- */
function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />;
  }
  return children;
}

/* ---- Layouts ---- */
function EmployeeLayout({ children }) {
  return (
    <div>
      <Suspense fallback={null}>
        <ParticleField />
      </Suspense>
      <Sidebar />
      <main className="main-content">
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

function AdminLayout({ children }) {
  return (
    <div>
      <Suspense fallback={null}>
        <ParticleField />
      </Suspense>
      <AdminSidebar />
      <main className="main-content" style={{ marginLeft: 280 }}>
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
}

/* ---- App Routes ---- */
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace /> : <Login />} />
        
        {/* Employee Routes */}
        <Route path="/dashboard" element={<ProtectedRoute requiredRole="EMPLOYEE"><EmployeeLayout><EmployeeDashboard /></EmployeeLayout></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute requiredRole="EMPLOYEE"><EmployeeLayout><EmployeeCalendar /></EmployeeLayout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute requiredRole="EMPLOYEE"><EmployeeLayout><EmployeeReports /></EmployeeLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute requiredRole="EMPLOYEE"><EmployeeLayout><EmployeeProfile /></EmployeeLayout></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminLayout><AdminOverview /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/employees" element={<ProtectedRoute requiredRole="ADMIN"><AdminLayout><AdminEmployees /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute requiredRole="ADMIN"><AdminLayout><AdminTaskReports /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/departments" element={<ProtectedRoute requiredRole="ADMIN"><AdminLayout><AdminDepartments /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/hours" element={<ProtectedRoute requiredRole="ADMIN"><AdminLayout><AdminHours /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/completion" element={<ProtectedRoute requiredRole="ADMIN"><AdminLayout><AdminCompletion /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/flagged" element={<ProtectedRoute requiredRole="ADMIN"><AdminLayout><AdminFlagged /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute requiredRole="ADMIN"><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return <AppRoutes />;
}
