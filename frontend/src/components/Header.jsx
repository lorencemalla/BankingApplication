import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import { RiNotification3Line } from 'react-icons/ri';

const Header = ({ title, subtitle }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchUnreadCount = () => {
    notificationAPI.getUnreadCount().then(res => {
      setUnreadCount(res.data?.data || 0);
    }).catch(() => {});
  };

  useEffect(() => {
    fetchUnreadCount();
  }, []);

  const toggleDropdown = async () => {
    if (!showDropdown) {
      try {
        const res = await notificationAPI.getAll();
        setNotifications(res.data?.data || []);
      } catch (err) {
        console.error(err);
      }
    }
    setShowDropdown(!showDropdown);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id, isRead) => {
    if (isRead) return;
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : 'U';
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="page-header" style={{ position: 'relative' }}>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="header-actions" style={{ position: 'relative' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: 8 }}>{dateStr}</span>
        
        <div style={{ position: 'relative' }}>
          <button className="notification-btn" onClick={toggleDropdown}>
            <RiNotification3Line />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          
          {showDropdown && (
            <>
              <div 
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} 
                onClick={() => setShowDropdown(false)} 
              />
              <div className="notifications-dropdown glass-card" style={{
                position: 'absolute',
                right: 0,
                top: '45px',
                width: '320px',
                maxHeight: '400px',
                overflowY: 'auto',
                zIndex: 1000,
                padding: '16px',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                borderRadius: '12px',
                background: 'rgba(15, 23, 42, 0.95)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 500 }}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {notifications.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px 0', fontSize: '0.8rem' }}>No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => handleMarkRead(n.id, n.read)} 
                        style={{ 
                          padding: '10px', 
                          borderRadius: '8px', 
                          background: n.read ? 'transparent' : 'rgba(37, 99, 235, 0.15)', 
                          borderLeft: n.read ? 'none' : '3px solid #2563eb',
                          cursor: n.read ? 'default' : 'pointer',
                          transition: 'background 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.8rem' }}>{n.title}</span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {user?.profileImage ? (
          <img src={user.profileImage} alt="Avatar" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-glass)' }} />
        ) : (
          <div className="user-avatar">{initials}</div>
        )}
      </div>
    </div>
  );
};

export default Header;
