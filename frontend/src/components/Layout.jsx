import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

const Layout = () => {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-spinner" />;
  if (!user) return <Navigate to="/login" />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
