import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { cardAPI, accountAPI } from '../services/api';

const Cards = () => {
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ accountNumber: '', cardType: 'DEBIT' });
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchCards(); accountAPI.getAll().then(r => setAccounts(r.data?.data || [])).catch(() => {}); }, []);

  async function fetchCards() {
    try { const res = await cardAPI.getAll(); setCards(res.data?.data || []); }
    catch (err) { console.error(err); } finally { setLoading(false); }
  }


  const handleCreate = async () => {
    try { await cardAPI.create(form); setShowCreate(false); fetchCards(); setMsg('Card created!'); setTimeout(() => setMsg(''), 3000); }
    catch (err) { setMsg(err.response?.data?.message || 'Failed'); }
  };

  const handleToggle = async (id) => {
    try { await cardAPI.toggleBlock(id); fetchCards(); }
    catch (err) { console.error(err); }
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div>
      <Header title="Card Management" subtitle="Manage your debit and credit cards" />
      {msg && <div className="success-message">{msg}</div>}
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Request New Card</button>
      </div>
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Request New Card</h2>
            <div className="form-group">
              <label>Account</label>
              <select className="form-control" value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })}>
                <option value="">Select Account</option>
                {accounts.map(a => <option key={a.id} value={a.accountNumber}>A/C {a.accountNumber}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Card Type</label>
              <select className="form-control" value={form.cardType} onChange={e => setForm({ ...form, cardType: e.target.value })}>
                <option value="DEBIT">Debit Card</option>
                <option value="CREDIT">Credit Card</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Request Card</button>
            </div>
          </div>
        </div>
      )}
      <div className="stats-grid">
        {cards.map(card => (
          <div key={card.id}>
            <div className="bank-card" style={{ marginBottom: 16 }}>
              <div className="card-type">{card.cardType} Card</div>
              <div className="card-number">{card.cardNumber}</div>
              <div className="card-bottom">
                <div className="card-holder">Card Holder<span>{card.cardHolderName}</span></div>
                <div className="card-expiry">Expires<span>{card.expiryDate}</span></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className={`badge ${card.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>{card.status}</span>
              <button className={`btn btn-sm ${card.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(card.id)}>
                {card.status === 'ACTIVE' ? 'Block' : 'Unblock'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {cards.length === 0 && <div className="glass-card"><div className="empty-state"><div className="icon">💳</div><p>No cards yet. Request your first card!</p></div></div>}
    </div>
  );
};

export default Cards;
