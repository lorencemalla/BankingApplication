import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { loanAPI } from '../services/api';
import { RiPercentLine } from 'react-icons/ri';

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [rates, setRates] = useState([]);
  const [tab, setTab] = useState('my-loans');
  const [form, setForm] = useState({ loanType: 'Personal', amount: '', termMonths: '12' });
  const [emiResult, setEmiResult] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loanAPI.getAll().then(r => setLoans(r.data?.data || [])).catch(() => {});
    loanAPI.getRates().then(r => setRates(r.data?.data || [])).catch(() => {});
  }, []);

  // Get current rate for selected loan type
  const getCurrentRate = (loanType) => {
    const rate = rates.find(r => r.loanType === loanType);
    return rate ? parseFloat(rate.interestRate) : null;
  };

  const selectedRate = getCurrentRate(form.loanType);

  const handleApply = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loanAPI.apply(form);
      setMsg({ text: 'Loan application submitted successfully! The bank will review your application.', type: 'success' });
      loanAPI.getAll().then(r => setLoans(r.data?.data || []));
      setForm({ ...form, amount: '' });
    } catch (err) { setMsg({ text: err.response?.data?.message || 'Failed', type: 'error' }); }
    finally { setLoading(false); }
  };

  const calcEMI = async () => {
    if (!form.amount || !form.termMonths) return;
    const rate = selectedRate || 10.5;
    try {
      const res = await loanAPI.calculateEMI(form.amount, rate, form.termMonths);
      setEmiResult(res.data?.data);
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <Header title="Loan Services" subtitle="Apply for loans and track EMIs" />
      <div className="tabs">
        {['my-loans', 'apply', 'emi-calculator', 'rates'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'my-loans' ? 'My Loans' : t === 'apply' ? 'Apply' : t === 'emi-calculator' ? 'EMI Calculator' : 'Interest Rates'}
          </button>
        ))}
      </div>
      {msg.text && <div className={msg.type === 'success' ? 'success-message' : 'error-message'}>{msg.text}</div>}

      {tab === 'my-loans' && (
        <div className="glass-card">
          {loans.length === 0 ? <div className="empty-state"><div className="icon">🏦</div><p>No loans found</p></div> : (
            <table className="data-table">
              <thead><tr><th>Loan ID</th><th>Type</th><th>Amount</th><th>Interest Rate</th><th>EMI</th><th>Term</th><th>Status</th></tr></thead>
              <tbody>
                {loans.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 500 }}>{l.loanId}</td>
                    <td>{l.loanType}</td>
                    <td>₹{parseFloat(l.amount).toLocaleString('en-IN')}</td>
                    <td><span className="badge badge-primary">{parseFloat(l.interestRate).toFixed(2)}% p.a.</span></td>
                    <td>₹{parseFloat(l.emi).toLocaleString('en-IN')}</td>
                    <td>{l.termMonths} months</td>
                    <td><span className={`badge ${l.status === 'APPROVED' ? 'badge-success' : l.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>{l.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'apply' && (
        <div className="glass-card" style={{ maxWidth: 600 }}>
          {/* Bank Interest Rate Notice */}
          {selectedRate && (
            <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
              <RiPercentLine style={{ fontSize: '1.4rem', color: '#3b82f6', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-dark)' }}>Bank Interest Rate for {form.loanType} Loan</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3b82f6', marginTop: 2 }}>{selectedRate.toFixed(2)}% per annum</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Rate set by NexusBank. Not editable by customer.</div>
              </div>
            </div>
          )}
          <form onSubmit={handleApply}>
            <div className="form-group">
              <label>Loan Type</label>
              <select className="form-control" value={form.loanType} onChange={e => setForm({ ...form, loanType: e.target.value })}>
                {['Personal', 'Home', 'Education', 'Vehicle', 'Business'].map(t => <option key={t} value={t}>{t} Loan</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" className="form-control" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required min="1000" placeholder="Minimum ₹1,000" />
            </div>
            <div className="form-group">
              <label>Term (Months)</label>
              <input type="number" className="form-control" value={form.termMonths} onChange={e => setForm({ ...form, termMonths: e.target.value })} required min="1" />
            </div>
            {/* Interest rate is NOT shown as an input — it's set by the bank */}
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>{loading ? 'Submitting...' : 'Apply for Loan'}</button>
          </form>
        </div>
      )}

      {tab === 'emi-calculator' && (
        <div className="glass-card" style={{ maxWidth: 600 }}>
          <div className="form-group">
            <label>Loan Type</label>
            <select className="form-control" value={form.loanType} onChange={e => setForm({ ...form, loanType: e.target.value })}>
              {['Personal', 'Home', 'Education', 'Vehicle', 'Business'].map(t => <option key={t} value={t}>{t} Loan</option>)}
            </select>
          </div>
          {selectedRate && (
            <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: 16, fontSize: '0.85rem' }}>
              <strong>Bank Rate:</strong> {selectedRate.toFixed(2)}% p.a. for {form.loanType} Loan
            </div>
          )}
          <div className="form-group"><label>Loan Amount (₹)</label><input type="number" className="form-control" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
          <div className="form-group"><label>Term (Months)</label><input type="number" className="form-control" value={form.termMonths} onChange={e => setForm({ ...form, termMonths: e.target.value })} /></div>
          <button className="btn btn-primary" onClick={calcEMI}>Calculate EMI</button>
          {emiResult && (
            <div className="stats-grid" style={{ marginTop: 24 }}>
              <div className="stat-card"><div className="stat-value">₹{parseFloat(emiResult.emi).toLocaleString('en-IN')}</div><div className="stat-label">Monthly EMI</div></div>
              <div className="stat-card"><div className="stat-value">₹{parseFloat(emiResult.totalPayment).toLocaleString('en-IN')}</div><div className="stat-label">Total Payment</div></div>
              <div className="stat-card"><div className="stat-value">₹{parseFloat(emiResult.totalInterest).toLocaleString('en-IN')}</div><div className="stat-label">Total Interest</div></div>
            </div>
          )}
        </div>
      )}

      {tab === 'rates' && (
        <div className="glass-card">
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><RiPercentLine /> Current Bank Interest Rates</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>Interest rates are set by NexusBank and applied automatically when you apply for a loan.</p>
          {rates.length === 0 ? (
            <div className="empty-state"><p>Interest rates not configured. Default rates will be applied.</p></div>
          ) : (
            <div className="stats-grid">
              {rates.map(r => (
                <div key={r.loanType} className="stat-card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5, marginBottom: 8 }}>{r.loanType} Loan</div>
                  <div className="stat-value" style={{ color: '#3b82f6' }}>{parseFloat(r.interestRate).toFixed(2)}%</div>
                  <div className="stat-label">per annum</div>
                  {r.minAmount && r.maxAmount && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6 }}>
                      ₹{parseFloat(r.minAmount).toLocaleString('en-IN')} — ₹{parseFloat(r.maxAmount).toLocaleString('en-IN')}
                    </div>
                  )}
                  {r.configuredByAdmin === false && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--yellow)', marginTop: 4 }}>Default Rate</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Loans;
