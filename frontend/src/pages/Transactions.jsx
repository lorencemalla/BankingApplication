import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { transactionAPI, accountAPI, billAPI } from '../services/api';
import { RiDownloadLine, RiFilterLine } from 'react-icons/ri';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [billHistory, setBillHistory] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [txRes, billRes, accRes] = await Promise.all([
          transactionAPI.getHistory(),
          billAPI.getHistory(),
          accountAPI.getAll()
        ]);
        setTransactions(txRes.data?.data || []);
        setBillHistory(billRes.data?.data || []);
        setAccounts(accRes.data?.data || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleDateFilter = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const res = await transactionAPI.getStatement(startDate, endDate);
      setTransactions(res.data?.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    setStartDate('');
    setEndDate('');
    setFilter('all');
    setTypeFilter('ALL');
    setLoading(true);
    try {
      const res = await transactionAPI.getHistory();
      setTransactions(res.data?.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Combine transactions and bill payments
  const allItems = [
    ...transactions.map(t => ({ ...t, source: 'transaction' })),
    ...billHistory.map(b => ({
      id: `bill-${b.id}`,
      transactionId: b.referenceNumber,
      type: 'BILL_PAYMENT',
      description: `${b.billerName} (${b.category?.replace(/_/g, ' ')})`,
      amount: b.amount,
      direction: 'DEBIT',
      status: b.paid ? 'COMPLETED' : 'PENDING',
      referenceNumber: b.referenceNumber,
      fromAccount: null,
      toAccount: null,
      createdAt: b.paidAt || b.createdAt,
      source: 'bill'
    }))
  ];

  // Sort by date desc
  allItems.sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const db = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return db - da;
  });

  // Apply filters
  let filtered = allItems;
  if (filter !== 'all') {
    filtered = filtered.filter(t => t.direction === filter.toUpperCase());
  }
  if (typeFilter !== 'ALL') {
    filtered = filtered.filter(t => t.type === typeFilter);
  }

  // Statement summary
  const totalCredit = filtered
    .filter(t => t.direction === 'CREDIT' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  const totalDebit = filtered
    .filter(t => t.direction === 'DEBIT' && t.status === 'COMPLETED')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  // Download CSV
  const downloadCSV = () => {
    const headers = ['Transaction ID', 'Type', 'Direction', 'From', 'To', 'Amount', 'Status', 'Description', 'Date'];
    const rows = filtered.map(tx => [
      tx.transactionId || tx.referenceNumber || '',
      tx.type || '',
      tx.direction || '',
      tx.fromAccount || '',
      tx.toAccount || '',
      tx.amount || '',
      tx.status || '',
      tx.description || '',
      tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN') : ''
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NexusBank_Statement_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="loading-spinner" />;

  return (
    <div>
      <Header title="Transaction Statements" subtitle="Complete transaction history & statements" />
      
      {/* Filter Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div className="tabs" style={{ marginBottom: 0 }}>
          {['all', 'credit', 'debit'].map(f => (
            <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowFilters(!showFilters)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RiFilterLine /> Filters
          </button>
          <button className="btn btn-primary btn-sm" onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RiDownloadLine /> Download CSV
          </button>
        </div>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="glass-card" style={{ marginBottom: 16, padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0, minWidth: 140 }}>
              <label>Transaction Type</label>
              <select className="form-control" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                <option value="ALL">All Types</option>
                <option value="TRANSFER">Transfer</option>
                <option value="DEPOSIT">Deposit</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="BILL_PAYMENT">Bill Payment</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="IMPS">IMPS</option>
                <option value="UPI">UPI</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Start Date</label>
              <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>End Date</label>
              <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleDateFilter}>Apply</button>
            <button className="btn btn-secondary btn-sm" onClick={handleReset}>Reset</button>
          </div>
        </div>
      )}

      {/* Statement Summary */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Total Credits</div>
          <div className="amount-credit" style={{ fontSize: '1.2rem' }}>+₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Total Debits</div>
          <div className="amount-debit" style={{ fontSize: '1.2rem' }}>-₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
        <div className="glass-card" style={{ padding: '16px 20px', borderLeft: `4px solid ${totalCredit - totalDebit >= 0 ? '#10b981' : '#ef4444'}` }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Net</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: totalCredit - totalDebit >= 0 ? 'var(--green)' : 'var(--red)' }}>
            {totalCredit - totalDebit >= 0 ? '+' : ''}₹{(totalCredit - totalDebit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-card">
        <div style={{ marginBottom: 12, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Showing {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">📄</div><p>No transactions found</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Type</th>
                <th>Description</th>
                <th>From</th>
                <th>To</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date & Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => (
                <tr key={tx.id}>
                  <td style={{ fontWeight: 500, fontSize: '0.8rem' }}>{tx.transactionId || tx.referenceNumber}</td>
                  <td><span className="badge badge-info">{tx.type?.replace(/_/g, ' ')}</span></td>
                  <td style={{ fontSize: '0.85rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.description || '—'}</td>
                  <td>{tx.fromAccount || '—'}</td>
                  <td>{tx.toAccount || '—'}</td>
                  <td className={tx.direction === 'CREDIT' ? 'amount-credit' : 'amount-debit'}>
                    {tx.direction === 'CREDIT' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString('en-IN')}
                  </td>
                  <td><span className={`badge ${tx.status === 'COMPLETED' ? 'badge-success' : tx.status === 'FAILED' ? 'badge-danger' : 'badge-warning'}`}>{tx.status}</span></td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {tx.createdAt ? (
                      <div>
                        <div>{new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{new Date(tx.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Transactions;
