import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { accountAPI } from '../services/api';

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newType, setNewType] = useState('SAVINGS');
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchAccounts(); }, []);

  async function fetchAccounts() {
    try {
      const res = await accountAPI.getAll();
      setAccounts(res.data?.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }


  const handleCreate = async () => {
    try {
      await accountAPI.create({ accountType: newType });
      setMsg('Account created successfully!');
      setShowCreate(false);
      fetchAccounts();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) { setMsg(err.response?.data?.message || 'Failed to create account'); }
  };

  const handleRequestDeletion = async (accountNumber) => {
    if (window.confirm("Are you sure you want to request deletion of this account? This request will be sent to the administrator.")) {
      try {
        await accountAPI.requestDeletion(accountNumber);
        setMsg('Account deletion request submitted!');
        fetchAccounts();
        setTimeout(() => setMsg(''), 3000);
      } catch (err) {
        setMsg(err.response?.data?.message || 'Failed to submit deletion request');
      }
    }
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div>
      <Header title="Accounts" subtitle="Manage all your bank accounts" />
      {msg && <div className="success-message">{msg}</div>}
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Account</button>
      </div>
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create New Account</h2>
            <div className="form-group">
              <label>Account Type</label>
              <select className="form-control" value={newType} onChange={e => setNewType(e.target.value)}>
                <option value="SAVINGS">Savings</option>
                <option value="CURRENT">Current</option>
                <option value="FIXED_DEPOSIT">Fixed Deposit</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Create Account</button>
            </div>
          </div>
        </div>
      )}
      <div className="stats-grid">
        {accounts.map(acc => (
          <div key={acc.id} className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span className="badge badge-primary">{acc.accountType}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {acc.deletionRequested && <span className="badge badge-warning">Deletion Pending</span>}
                <span className={`badge ${acc.active ? 'badge-success' : 'badge-danger'}`}>{acc.active ? 'Active' : 'Closed'}</span>
              </div>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Account Number</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: 1, marginBottom: 16 }}>{acc.accountNumber}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Balance</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--green)' }}>₹{parseFloat(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <div style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>{acc.branchName}</span><span>•</span><span>{acc.ifscCode}</span>
              </div>
              {acc.active && !acc.deletionRequested && (
                <button 
                  className="btn btn-danger btn-sm" 
                  style={{ padding: '4px 8px', fontSize: '0.75rem', border: 'none', cursor: 'pointer' }}
                  onClick={() => handleRequestDeletion(acc.accountNumber)}
                >
                  Request Deletion
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Accounts;
