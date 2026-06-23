import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { billAPI, accountAPI } from '../services/api';

const CATEGORIES = ['ELECTRICITY', 'WATER', 'MOBILE_RECHARGE', 'DTH_RECHARGE', 'CREDIT_CARD', 'GAS', 'INTERNET'];

const Bills = () => {
  const [accounts, setAccounts] = useState([]);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState('pay');
  const [form, setForm] = useState({ accountNumber: '', category: 'ELECTRICITY', billerName: '', consumerNumber: '', amount: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpMsg, setOtpMsg] = useState('');

  useEffect(() => {
    accountAPI.getAll().then(r => setAccounts(r.data?.data || [])).catch(() => {});
    billAPI.getHistory().then(r => setHistory(r.data?.data || [])).catch(() => {});
  }, []);

  const handlePay = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await billAPI.pay({ ...form, otp });
      if (res.data?.data?.status === 'OTP_REQUIRED') {
        setShowOtpModal(true);
        setOtpMsg(res.data?.data?.message || 'Please enter the OTP sent to your registered email.');
      } else {
        setMsg({ text: `Payment successful! Ref: ${res.data?.data?.referenceNumber}`, type: 'success' });
        setForm({ ...form, billerName: '', consumerNumber: '', amount: '' });
        setShowOtpModal(false);
        setOtp('');
        billAPI.getHistory().then(r => setHistory(r.data?.data || []));
        accountAPI.getAll().then(r => setAccounts(r.data?.data || []));
      }
    } catch (err) { 
      setMsg({ text: err.response?.data?.message || 'Payment failed', type: 'error' }); 
    }
    finally { setLoading(false); }
  };

  return (
    <div>
      <Header title="Bill Payments" subtitle="Pay your utility bills" />
      <div className="tabs">
        <button className={`tab ${tab === 'pay' ? 'active' : ''}`} onClick={() => setTab('pay')}>Pay Bill</button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>History</button>
      </div>
      {msg.text && <div className={msg.type === 'success' ? 'success-message' : 'error-message'}>{msg.text}</div>}
      {tab === 'pay' && (
        <div className="glass-card" style={{ maxWidth: 600 }}>
          <form onSubmit={handlePay}>
            <div className="form-group">
              <label>From Account</label>
              <select className="form-control" value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} required>
                <option value="">Select Account</option>
                {accounts.map(a => <option key={a.id} value={a.accountNumber}>A/C {a.accountNumber} (₹{parseFloat(a.balance).toLocaleString('en-IN')})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Biller Name</label>
              <input className="form-control" placeholder="E.g., Jio, Airtel, BSES" value={form.billerName} onChange={e => setForm({ ...form, billerName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Consumer Number</label>
              <input className="form-control" placeholder="Enter consumer/subscriber number" value={form.consumerNumber} onChange={e => setForm({ ...form, consumerNumber: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" className="form-control" placeholder="Enter amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required min="1" />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>{loading ? 'Processing...' : 'Pay Now'}</button>
          </form>
        </div>
      )}
      {tab === 'history' && (
        <div className="glass-card">
          {history.length === 0 ? <div className="empty-state"><p>No bill payments yet</p></div> : (
            <table className="data-table">
              <thead><tr><th>Biller</th><th>Category</th><th>Amount</th><th>Reference</th><th>Date</th></tr></thead>
              <tbody>
                {history.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 500 }}>{b.billerName}</td>
                    <td><span className="badge badge-info">{b.category?.replace(/_/g, ' ')}</span></td>
                    <td className="amount-debit">₹{parseFloat(b.amount).toLocaleString('en-IN')}</td>
                    <td style={{ fontSize: '0.85rem' }}>{b.referenceNumber}</td>
                    <td>{b.paidAt ? new Date(b.paidAt).toLocaleDateString('en-IN') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="modal-overlay" onClick={() => { setShowOtpModal(false); setOtp(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Verify Bill Payment OTP</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>{otpMsg}</p>
            <form onSubmit={handlePay}>
              <div className="form-group">
                <label>Enter 6-Digit OTP</label>
                <input 
                  type="text" 
                  maxLength="6" 
                  className="form-control" 
                  placeholder="E.g., 123456" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)} 
                  required 
                  style={{ letterSpacing: 6, fontSize: '1.25rem', textAlign: 'center', fontWeight: 'bold' }}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowOtpModal(false); setOtp(''); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Verifying...' : 'Verify & Pay'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bills;
