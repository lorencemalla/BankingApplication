import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { transactionAPI, accountAPI, beneficiaryAPI } from '../services/api';

const Transfer = () => {
  const [accounts, setAccounts] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [form, setForm] = useState({ fromAccountNumber: '', toAccountNumber: '', amount: '', description: '', transferType: 'TRANSFER' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [tab, setTab] = useState('transfer');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpMsg, setOtpMsg] = useState('');
  const [pendingAction, setPendingAction] = useState(null); // 'transfer' | 'deposit' | 'withdraw'

  useEffect(() => {
    accountAPI.getAll().then(r => setAccounts(r.data?.data || [])).catch(() => {});
    beneficiaryAPI.getAll().then(r => setBeneficiaries(r.data?.data || [])).catch(() => {});
  }, []);

  const handleTransfer = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await transactionAPI.transfer({ ...form, otp });
      if (res.data?.data?.status === 'OTP_REQUIRED') {
        setShowOtpModal(true);
        setOtpMsg(res.data?.data?.message || 'Please enter the OTP sent to your registered email.');
        setPendingAction('transfer');
      } else {
        setMsg({ text: `Transfer successful! Ref: ${res.data?.data?.referenceNumber}`, type: 'success' });
        setForm({ ...form, toAccountNumber: '', amount: '', description: '' });
        setShowOtpModal(false);
        setOtp('');
        setPendingAction(null);
        accountAPI.getAll().then(r => setAccounts(r.data?.data || [])).catch(() => {});
      }
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Transfer failed', type: 'error' });
    } finally { setLoading(false); }
  };

  const handleDeposit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await transactionAPI.deposit({ accountNumber: form.fromAccountNumber, amount: form.amount, otp });
      if (res.data?.data?.status === 'OTP_REQUIRED') {
        setShowOtpModal(true);
        setOtpMsg(res.data?.data?.message || 'Please enter the OTP sent to your registered email.');
        setPendingAction('deposit');
      } else {
        setMsg({ text: `Deposit successful! New Balance: ₹${parseFloat(res.data?.data?.newBalance).toLocaleString('en-IN')}`, type: 'success' });
        setForm({ ...form, amount: '' });
        setShowOtpModal(false);
        setOtp('');
        setPendingAction(null);
        accountAPI.getAll().then(r => setAccounts(r.data?.data || [])).catch(() => {});
      }
    } catch (err) { setMsg({ text: err.response?.data?.message || 'Deposit failed', type: 'error' }); }
    finally { setLoading(false); }
  };

  const handleWithdraw = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await transactionAPI.withdraw({ accountNumber: form.fromAccountNumber, amount: form.amount, otp });
      if (res.data?.data?.status === 'OTP_REQUIRED') {
        setShowOtpModal(true);
        setOtpMsg(res.data?.data?.message || 'Please enter the OTP sent to your registered email.');
        setPendingAction('withdraw');
      } else {
        setMsg({ text: `Withdrawal successful! New Balance: ₹${parseFloat(res.data?.data?.newBalance).toLocaleString('en-IN')}`, type: 'success' });
        setForm({ ...form, amount: '' });
        setShowOtpModal(false);
        setOtp('');
        setPendingAction(null);
        accountAPI.getAll().then(r => setAccounts(r.data?.data || [])).catch(() => {});
      }
    } catch (err) { setMsg({ text: err.response?.data?.message || 'Withdrawal failed', type: 'error' }); }
    finally { setLoading(false); }
  };

  const handleOtpSubmit = (e) => {
    if (e) e.preventDefault();
    if (pendingAction === 'transfer') handleTransfer();
    else if (pendingAction === 'deposit') handleDeposit();
    else if (pendingAction === 'withdraw') handleWithdraw();
  };

  const update = (k, v) => setForm({ ...form, [k]: v });

  const getOtpTitle = () => {
    if (pendingAction === 'deposit') return 'Verify Deposit OTP';
    if (pendingAction === 'withdraw') return 'Verify Withdrawal OTP';
    return 'Verify Transaction OTP';
  };

  return (
    <div>
      <Header title="Fund Transfer" subtitle="Send money securely" />
      <div className="tabs">
        {['transfer', 'deposit', 'withdraw'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setMsg({ text: '', type: '' }); setOtp(''); setShowOtpModal(false); setPendingAction(null); }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      {msg.text && <div className={msg.type === 'success' ? 'success-message' : 'error-message'}>{msg.text}</div>}
      <div className="glass-card" style={{ maxWidth: 600 }}>
        {tab === 'transfer' && (
          <form onSubmit={handleTransfer}>
            <div className="form-group">
              <label>From Account</label>
              <select className="form-control" value={form.fromAccountNumber} onChange={e => update('fromAccountNumber', e.target.value)} required>
                <option value="">Select Account</option>
                {accounts.map(a => <option key={a.id} value={a.accountNumber}>A/C {a.accountNumber} (₹{parseFloat(a.balance).toLocaleString('en-IN')})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>To Account Number</label>
              <input className="form-control" placeholder="Enter account number" value={form.toAccountNumber} onChange={e => update('toAccountNumber', e.target.value)} required />
              {beneficiaries.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {beneficiaries.map(b => (
                    <button key={b.id} type="button" className="btn btn-secondary btn-sm" onClick={() => update('toAccountNumber', b.accountNumber)}>
                      {b.nickname || b.beneficiaryName}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Transfer Type</label>
              <select className="form-control" value={form.transferType} onChange={e => update('transferType', e.target.value)}>
                {['TRANSFER', 'NEFT', 'RTGS', 'IMPS', 'UPI'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" className="form-control" placeholder="Enter amount" value={form.amount} onChange={e => update('amount', e.target.value)} required min="1" />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input className="form-control" placeholder="Optional description" value={form.description} onChange={e => update('description', e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>{loading ? 'Processing...' : 'Transfer Now'}</button>
          </form>
        )}
        {(tab === 'deposit' || tab === 'withdraw') && (
          <form onSubmit={tab === 'deposit' ? handleDeposit : handleWithdraw}>
            <div className="form-group">
              <label>Account</label>
              <select className="form-control" value={form.fromAccountNumber} onChange={e => update('fromAccountNumber', e.target.value)} required>
                <option value="">Select Account</option>
                {accounts.map(a => <option key={a.id} value={a.accountNumber}>A/C {a.accountNumber} (₹{parseFloat(a.balance).toLocaleString('en-IN')})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" className="form-control" placeholder="Enter amount" value={form.amount} onChange={e => update('amount', e.target.value)} required min="1" />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              {loading ? 'Processing...' : tab === 'deposit' ? 'Deposit' : 'Withdraw'}
            </button>
          </form>
        )}
      </div>

      {/* Unified OTP Modal for Transfer, Deposit, and Withdraw */}
      {showOtpModal && (
        <div className="modal-overlay" onClick={() => { setShowOtpModal(false); setOtp(''); setPendingAction(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{getOtpTitle()}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>{otpMsg}</p>
            <form onSubmit={handleOtpSubmit}>
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
                <button type="button" className="btn btn-secondary" onClick={() => { setShowOtpModal(false); setOtp(''); setPendingAction(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Verifying...' : 'Verify & Confirm'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transfer;
