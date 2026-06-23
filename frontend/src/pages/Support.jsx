import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { supportAPI } from '../services/api';

const Support = () => {
  const [tickets, setTickets] = useState([]);
  const [tab, setTab] = useState('tickets');
  const [form, setForm] = useState({ subject: '', description: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { supportAPI.getTickets().then(r => setTickets(r.data?.data || [])).catch(() => {}); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await supportAPI.createTicket(form);
      setMsg({ text: 'Ticket created successfully!', type: 'success' });
      setForm({ subject: '', description: '' });
      setTab('tickets');
      supportAPI.getTickets().then(r => setTickets(r.data?.data || []));
    } catch (err) { setMsg({ text: err.response?.data?.message || 'Failed', type: 'error' }); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <Header title="Customer Support" subtitle="Get help with your banking needs" />
      <div className="tabs">
        <button className={`tab ${tab === 'tickets' ? 'active' : ''}`} onClick={() => setTab('tickets')}>My Tickets</button>
        <button className={`tab ${tab === 'create' ? 'active' : ''}`} onClick={() => setTab('create')}>New Ticket</button>
      </div>
      {msg.text && <div className={msg.type === 'success' ? 'success-message' : 'error-message'}>{msg.text}</div>}

      {tab === 'tickets' && (
        <div className="glass-card">
          {tickets.length === 0 ? <div className="empty-state"><div className="icon">🎫</div><p>No support tickets</p></div> : (
            <table className="data-table">
              <thead><tr><th>Ticket #</th><th>Subject</th><th>Status</th><th>Created</th><th>Response</th></tr></thead>
              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500 }}>{t.ticketNumber}</td>
                    <td>{t.subject}</td>
                    <td><span className={`badge ${t.status === 'RESOLVED' ? 'badge-success' : t.status === 'OPEN' ? 'badge-warning' : 'badge-info'}`}>{t.status}</span></td>
                    <td>{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.response || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'create' && (
        <div className="glass-card" style={{ maxWidth: 600 }}>
          <form onSubmit={handleCreate}>
            <div className="form-group"><label>Subject</label><input className="form-control" placeholder="Brief description of your issue" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required /></div>
            <div className="form-group"><label>Description</label><textarea className="form-control" rows="5" placeholder="Describe your issue in detail..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required style={{ resize: 'vertical' }} /></div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>{loading ? 'Submitting...' : 'Submit Ticket'}</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Support;
