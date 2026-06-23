import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RiDashboardLine, RiExchangeFundsLine, RiBankLine, RiFileListLine, RiBillLine, RiBankCardLine, RiHandCoinLine, RiCustomerService2Line, RiSettings3Line, RiAdminLine, RiLogoutBoxLine, RiShieldCheckLine, RiUserLine, RiPieChartLine, RiPercentLine } from 'react-icons/ri';

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  // Customer navigation items
  const customerNavItems = [
    { path: '/dashboard', icon: <RiDashboardLine />, label: 'Dashboard' },
    { path: '/accounts', icon: <RiBankLine />, label: 'My Accounts' },
    { path: '/transfer', icon: <RiExchangeFundsLine />, label: 'Fund Transfer' },
    { path: '/transactions', icon: <RiFileListLine />, label: 'Statements' },
    { path: '/bills', icon: <RiBillLine />, label: 'Bill Payments' },
    { path: '/cards', icon: <RiBankCardLine />, label: 'Card Services' },
    { path: '/loans', icon: <RiHandCoinLine />, label: 'Loan Services' },
    { path: '/support', icon: <RiCustomerService2Line />, label: 'Help & Support' },
    { path: '/profile', icon: <RiSettings3Line />, label: 'Settings' },
  ];

  // Admin navigation items — completely different from customer
  const adminNavItems = [
    { path: '/admin', icon: <RiPieChartLine />, label: 'Dashboard', end: true },
  ];

  const navItems = isAdmin() ? adminNavItems : customerNavItems;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">NB</div>
        <div>
          <h2>NexusBank</h2>
          <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginTop: 1 }}>
            {isAdmin() ? 'Admin Console' : 'Internet Banking'}
          </div>
        </div>
      </div>

      {/* User Info */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user?.profileImage ? (
            <img src={user.profileImage} alt="Avatar" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: isAdmin() ? 'rgba(239,68,68,0.3)' : 'rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
              {user?.firstName?.[0] || ''}{user?.lastName?.[0] || ''}
            </div>
          )}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{user?.firstName} {user?.lastName}</div>
            <div style={{ fontSize: '0.7rem', color: isAdmin() ? 'rgba(239,68,68,0.8)' : 'rgba(255,255,255,0.4)' }}>
              {isAdmin() ? '⚡ System Administrator' : 'Customer'}
            </div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, padding: '12px 16px 6px' }}>
          {isAdmin() ? 'Admin Console' : 'Main Menu'}
        </div>
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            end={item.end || false}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px 10px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>
          <RiShieldCheckLine style={{ fontSize: '0.8rem' }} /> Secure Session
        </div>
        <div className="nav-item" onClick={handleLogout} style={{ color: 'rgba(255,120,120,0.8)' }}>
          <span className="icon"><RiLogoutBoxLine /></span>
          Sign Out
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
