import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Transfer from './pages/Transfer';
import Transactions from './pages/Transactions';
import Bills from './pages/Bills';
import Cards from './pages/Cards';
import Loans from './pages/Loans';
import Support from './pages/Support';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

// Redirect admin to /admin when they visit /dashboard
const SmartDashboard = () => {
  const { isAdmin } = useAuth();
  if (isAdmin()) return <Navigate to="/admin" replace />;
  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<SmartDashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/bills" element={<Bills />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/support" element={<Support />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
