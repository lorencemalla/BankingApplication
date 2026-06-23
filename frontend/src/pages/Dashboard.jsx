import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { accountAPI, transactionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RiBankLine, RiExchangeFundsLine, RiBillLine, RiBankCardLine, RiHandCoinLine, RiFileListLine, RiCustomerService2Line, RiUser3Line, RiArrowDownLine, RiArrowUpLine } from 'react-icons/ri';

const activityIcon = (type, direction) => {
  if (type === 'BILL_PAYMENT') return { icon: '📄', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Bill Payment' };
  if (type === 'DEPOSIT') return { icon: '⬇️', color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Deposit' };
  if (type === 'WITHDRAWAL') return { icon: '⬆️', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Withdrawal' };
  if (type === 'TRANSFER' || type === 'NEFT' || type === 'RTGS' || type === 'IMPS' || type === 'UPI') {
    if (direction === 'CREDIT') return { icon: '↓', color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: type };
    return { icon: '↑', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: type };
  }
  return direction === 'CREDIT' 
    ? { icon: '↓', color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: type }
    : { icon: '↑', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: type };
};

const Dashboard = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accRes, actRes] = await Promise.all([
          accountAPI.getAll(), 
          transactionAPI.getRecentActivity()
        ]);
        setAccounts(accRes.data?.data || []);
        setActivities(actRes.data?.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0);

  if (loading) return <div className="loading-spinner" />;

  return (
    <div>
      <Header title={`Welcome, ${user?.firstName || 'User'}`} subtitle="Here's your financial overview for today" />

      {/* Welcome Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0b1f3f 0%, #1a3a6e 50%, #2563eb 100%)', borderRadius: 'var(--radius-lg)', padding: '28px 32px', marginBottom: 24, color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -20, width: 200, height: 200, background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Total Available Balance</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: 4 }}>{accounts.length} Active Account{accounts.length !== 1 ? 's' : ''}</div>
          </div>
          <Link to="/transfer" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)' }}>Quick Transfer →</Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 24 }}>
        <h3 className="section-title">Quick Actions</h3>
        <div className="quick-actions">
          <Link to="/transfer" className="quick-action-btn"><span className="icon"><RiExchangeFundsLine /></span>Fund Transfer</Link>
          <Link to="/bills" className="quick-action-btn"><span className="icon"><RiBillLine /></span>Bill Payment</Link>
          <Link to="/accounts" className="quick-action-btn"><span className="icon"><RiBankLine /></span>My Accounts</Link>
          <Link to="/cards" className="quick-action-btn"><span className="icon"><RiBankCardLine /></span>Card Services</Link>
          <Link to="/loans" className="quick-action-btn"><span className="icon"><RiHandCoinLine /></span>Loan Services</Link>
          <Link to="/transactions" className="quick-action-btn"><span className="icon"><RiFileListLine /></span>Statements</Link>
          <Link to="/support" className="quick-action-btn"><span className="icon"><RiCustomerService2Line /></span>Support</Link>
          <Link to="/profile" className="quick-action-btn"><span className="icon"><RiUser3Line /></span>My Profile</Link>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Account Summary */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="section-title" style={{ marginBottom: 0 }}>Account Summary</h3>
            <Link to="/accounts" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>View All →</Link>
          </div>
          {accounts.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No accounts found.</p> :
            accounts.map(acc => (
              <div key={acc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontSize: '1.1rem' }}><RiBankLine /></div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-dark)' }}>{acc.accountType} Account</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>A/C •••• {acc.accountNumber?.slice(-4)}</div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '0.95rem' }}>₹{parseFloat(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              </div>
            ))
          }
        </div>

        {/* Recent Activity — now showing all transaction types */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="section-title" style={{ marginBottom: 0 }}>Recent Activity</h3>
            <Link to="/transactions" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>View All →</Link>
          </div>
          {activities.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}><p>No transactions yet</p></div>
          ) : (
            activities.map((tx, idx) => {
              const info = activityIcon(tx.type, tx.direction);
              return (
                <div key={tx.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: info.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: info.color, fontSize: '0.95rem' }}>
                      {info.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.85rem', color: 'var(--text-dark)' }}>
                        {tx.description || info.label}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
                        <span className="badge" style={{ fontSize: '0.6rem', padding: '1px 6px', background: info.bg, color: info.color }}>{tx.type?.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={tx.direction === 'CREDIT' ? 'amount-credit' : 'amount-debit'} style={{ fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                    {tx.direction === 'CREDIT' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString('en-IN')}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
