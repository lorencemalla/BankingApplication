import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { adminAPI } from '../services/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { RiUserLine, RiBankLine, RiExchangeFundsLine, RiCustomerService2Line, RiDeleteBin5Line, RiMoneyDollarCircleLine, RiHandCoinLine, RiArrowUpLine, RiArrowDownLine, RiPercentLine, RiSearchLine, RiEyeLine } from 'react-icons/ri';

const CHART_COLORS = ['#6366f1', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const Admin = () => {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [deletionRequests, setDeletionRequests] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [loanRates, setLoanRates] = useState([]);
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [showAdjustBalance, setShowAdjustBalance] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [showUserDetail, setShowUserDetail] = useState(null);
  const [userTransactions, setUserTransactions] = useState([]);
  const [userAccounts, setUserAccounts] = useState([]);
  const [rateForm, setRateForm] = useState({ loanType: 'Personal', interestRate: '', minAmount: '', maxAmount: '', minTermMonths: '', maxTermMonths: '' });
  const [rateMsg, setRateMsg] = useState('');
  const [txSearch, setTxSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [dashRes, usersRes, accountsRes, requestsRes, ticketsRes] = await Promise.all([
        adminAPI.getDashboard(),
        adminAPI.getUsers(),
        adminAPI.getAccounts(),
        adminAPI.getDeletionRequests(),
        adminAPI.getTickets()
      ]);
      setStats(dashRes.data?.data || {});
      setUsers(usersRes.data?.data || []);
      setAccounts(accountsRes.data?.data || []);
      setDeletionRequests(requestsRes.data?.data || []);
      setTickets(ticketsRes.data?.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }


  const fetchTransactions = async () => {
    try {
      const res = await adminAPI.getAllTransactions();
      setAllTransactions(res.data?.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchLoans = async () => {
    try {
      const [loansRes, ratesRes] = await Promise.all([adminAPI.getAllLoans(), adminAPI.getLoanRates()]);
      setAllLoans(loansRes.data?.data || []);
      setLoanRates(ratesRes.data?.data || []);
    } catch (err) { console.error(err); }
  };

  const handleTabChange = (newTab) => {
    setTab(newTab);
    if (newTab === 'transactions' && allTransactions.length === 0) fetchTransactions();
    if (newTab === 'loans' && allLoans.length === 0) fetchLoans();
  };

  const handleToggleUser = async (id) => { await adminAPI.toggleUserStatus(id); fetchData(); };
  const handleToggleAccount = async (id) => { await adminAPI.toggleAccountStatus(id); fetchData(); };

  const handleAdjustBalanceSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.adjustAccountBalance(selectedAccount.id, { balance: adjustAmount });
      setShowAdjustBalance(false); setSelectedAccount(null); fetchData();
    } catch (err) { alert('Failed to adjust balance'); }
  };

  const handleDeleteAccount = async (id) => {
    if (window.confirm('Are you sure you want to permanently delete this account?')) {
      try { await adminAPI.deleteAccount(id); fetchData(); } 
      catch (err) { alert(err.response?.data?.message || 'Failed to delete account'); }
    }
  };

  const handleApproveDeletion = async (id) => {
    if (window.confirm('Approve account deletion request?')) { await adminAPI.approveDeletion(id); fetchData(); }
  };
  const handleRejectDeletion = async (id) => { await adminAPI.rejectDeletion(id); fetchData(); };

  const handleResolve = async (id) => {
    const response = prompt('Enter resolution response:');
    if (response) { await adminAPI.resolveTicket(id, { response }); fetchData(); }
  };

  const handleApproveLoan = async (id) => { await adminAPI.approveLoan(id); fetchLoans(); };
  const handleRejectLoan = async (id) => { await adminAPI.rejectLoan(id); fetchLoans(); };

  const handleViewUser = async (userId) => {
    try {
      const [txRes, accRes] = await Promise.all([adminAPI.getUserTransactions(userId), adminAPI.getUserAccounts(userId)]);
      setUserTransactions(txRes.data?.data || []);
      setUserAccounts(accRes.data?.data || []);
      setShowUserDetail(userId);
    } catch (err) { console.error(err); }
  };

  const handleSetRate = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.setLoanRate(rateForm);
      setRateMsg('Rate updated successfully!');
      fetchLoans();
      setTimeout(() => setRateMsg(''), 3000);
    } catch (err) { setRateMsg('Failed to update rate'); }
  };

  // Chart data preparation
  const accountTypeData = stats.accountTypeDistribution ? 
    Object.entries(stats.accountTypeDistribution).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })) : [];
  
  const loanStatusData = [
    { name: 'Pending', value: stats.pendingLoans || 0 },
    { name: 'Approved', value: stats.approvedLoans || 0 },
    { name: 'Rejected', value: stats.rejectedLoans || 0 },
  ].filter(d => d.value > 0);

  const txVolumeData = (stats.transactionVolume || []).map(d => ({
    date: d.date ? new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '',
    count: d.count
  }));

  const txAmountData = (stats.transactionAmounts || []).map(d => ({
    date: d.date ? new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '',
    amount: parseFloat(d.amount) || 0
  }));

  const filteredTx = txSearch 
    ? allTransactions.filter(t => 
        t.transactionId?.toLowerCase().includes(txSearch.toLowerCase()) ||
        t.type?.toLowerCase().includes(txSearch.toLowerCase()) ||
        t.fromAccount?.userName?.toLowerCase().includes(txSearch.toLowerCase()) ||
        t.toAccount?.userName?.toLowerCase().includes(txSearch.toLowerCase())
      )
    : allTransactions;

  const filteredUsers = userSearch
    ? users.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.phone?.includes(userSearch)
      )
    : users;

  if (loading) return <div className="loading-spinner" />;

  return (
    <div>
      <Header title="Admin Dashboard" subtitle="System overview & management console" />
      <div className="tabs" style={{ flexWrap: 'wrap', gap: '8px' }}>
        {[
          { id: 'dashboard', label: '📊 Dashboard' },
          { id: 'users', label: '👥 Users' },
          { id: 'accounts', label: '🏦 Accounts' },
          { id: 'transactions', label: '💱 Transactions' },
          { id: 'loans', label: '🏠 Loans' },
          { id: 'deletionRequests', label: '🗑 Deletions' },
          { id: 'tickets', label: '🎫 Tickets' }
        ].map(t => (
          <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => handleTabChange(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ========== DASHBOARD TAB ========== */}
      {tab === 'dashboard' && (
        <div>
          {/* Top Stats Cards */}
          <div className="admin-stats-grid">
            {[
              { icon: <RiUserLine />, value: stats.totalUsers, label: 'Total Users', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', trend: '+12%' },
              { icon: <RiBankLine />, value: stats.totalAccounts, label: 'Total Accounts', color: '#10b981', bg: 'rgba(16,185,129,0.12)', trend: '+8%' },
              { icon: <RiExchangeFundsLine />, value: stats.totalTransactions, label: 'Total Transactions', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', trend: '+24%' },
              { icon: <RiMoneyDollarCircleLine />, value: `₹${(parseFloat(stats.totalSystemBalance) || 0).toLocaleString('en-IN')}`, label: 'System Balance', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', trend: '' },
              { icon: <RiHandCoinLine />, value: stats.totalLoans, label: 'Total Loans', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', trend: '' },
              { icon: <RiCustomerService2Line />, value: stats.openTickets, label: 'Open Tickets', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', trend: '' },
            ].map((s, i) => (
              <div key={i} className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                <div>
                  <div className="admin-stat-value">{s.value ?? 0}</div>
                  <div className="admin-stat-label">{s.label}</div>
                </div>
                {s.trend && <div className="admin-stat-trend" style={{ color: '#10b981' }}><RiArrowUpLine /> {s.trend}</div>}
              </div>
            ))}
          </div>

          {/* Financial Summary Cards */}
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <div className="glass-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Total Deposits</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>₹{(parseFloat(stats.totalDepositAmount) || 0).toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{stats.totalDeposits || 0} transactions</div>
            </div>
            <div className="glass-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Total Withdrawals</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ef4444' }}>₹{(parseFloat(stats.totalWithdrawalAmount) || 0).toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{stats.totalWithdrawals || 0} transactions</div>
            </div>
            <div className="glass-card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Total Transfers</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#3b82f6' }}>₹{(parseFloat(stats.totalTransferAmount) || 0).toLocaleString('en-IN')}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{stats.totalTransfers || 0} transactions</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid-2" style={{ marginBottom: 24 }}>
            {/* Transaction Volume Chart */}
            <div className="glass-card">
              <h3 className="section-title">Transaction Volume (Last 30 Days)</h3>
              {txVolumeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={txVolumeData}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" fontSize={11} tick={{ fill: '#94a3b8' }} />
                    <YAxis fontSize={11} tick={{ fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" name="Transactions" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No transaction data available</p></div>}
            </div>

            {/* Transaction Amount Chart */}
            <div className="glass-card">
              <h3 className="section-title">Transaction Amount (Last 30 Days)</h3>
              {txAmountData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={txAmountData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" fontSize={11} tick={{ fill: '#94a3b8' }} />
                    <YAxis fontSize={11} tick={{ fill: '#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e2e8f0' }} formatter={v => [`₹${parseFloat(v).toLocaleString('en-IN')}`, 'Amount']} />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Amount" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No transaction data available</p></div>}
            </div>
          </div>

          {/* Pie Charts Row */}
          <div className="grid-2" style={{ marginBottom: 24 }}>
            <div className="glass-card">
              <h3 className="section-title">Account Type Distribution</h3>
              {accountTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={accountTypeData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {accountTypeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No account data</p></div>}
            </div>

            <div className="glass-card">
              <h3 className="section-title">Loan Status Distribution</h3>
              {loanStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={loanStatusData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      <Cell fill="#f59e0b" />
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="empty-state"><p>No loan data</p></div>}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="glass-card">
            <h3 className="section-title">Recent System Transactions</h3>
            {(stats.recentTransactions || []).length === 0 ? (
              <div className="empty-state"><p>No transactions yet</p></div>
            ) : (
              <table className="data-table">
                <thead><tr><th>ID</th><th>Type</th><th>From</th><th>To</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {(stats.recentTransactions || []).map(tx => (
                    <tr key={tx.id}>
                      <td style={{ fontWeight: 500, fontSize: '0.8rem' }}>{tx.transactionId}</td>
                      <td><span className="badge badge-info">{tx.type}</span></td>
                      <td style={{ fontSize: '0.8rem' }}>{tx.fromAccount ? `${tx.fromAccount.userName || ''} (${tx.fromAccount.accountNumber})` : '—'}</td>
                      <td style={{ fontSize: '0.8rem' }}>{tx.toAccount ? `${tx.toAccount.userName || ''} (${tx.toAccount.accountNumber})` : '—'}</td>
                      <td style={{ fontWeight: 700 }}>₹{parseFloat(tx.amount).toLocaleString('en-IN')}</td>
                      <td><span className={`badge ${tx.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{tx.status}</span></td>
                      <td style={{ fontSize: '0.8rem' }}>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ========== USERS TAB ========== */}
      {tab === 'users' && (
        <div>
          <div className="glass-card" style={{ marginBottom: 16, padding: '12px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <RiSearchLine style={{ color: 'var(--text-muted)' }} />
              <input className="form-control" placeholder="Search users by name, email, or phone..." value={userSearch} onChange={e => setUserSearch(e.target.value)} style={{ border: 'none', boxShadow: 'none', padding: '8px 0' }} />
            </div>
          </div>
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>Profile</th><th>Name</th><th>Email</th><th>Phone</th><th>National ID</th><th>Role</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      {u.profileImage ? (
                        <img src={u.profileImage} alt="Avatar" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                          {u.firstName?.[0] || ''}{u.lastName?.[0] || ''}
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 500 }}>{u.firstName} {u.lastName}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>{u.nationalIdentification || '—'}</td>
                    <td><span className="badge badge-primary">{u.role}</span></td>
                    <td><span className={`badge ${u.enabled ? 'badge-success' : 'badge-danger'}`}>{u.enabled ? 'Active' : 'Disabled'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className={`btn btn-sm ${u.enabled ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggleUser(u.id)}>{u.enabled ? 'Disable' : 'Enable'}</button>
                        <button className="btn btn-sm btn-secondary" onClick={() => handleViewUser(u.id)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><RiEyeLine /> View</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== ACCOUNTS TAB ========== */}
      {tab === 'accounts' && (
        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Account Number</th><th>User Details</th><th>Type</th><th>Balance</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {accounts.map(acc => (
                <tr key={acc.id}>
                  <td style={{ fontWeight: 600, letterSpacing: 0.5 }}>{acc.accountNumber}</td>
                  <td>
                    {acc.user ? (
                      <div>
                        <div style={{ fontWeight: 500 }}>{acc.user.firstName} {acc.user.lastName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{acc.user.email}</div>
                      </div>
                    ) : '—'}
                  </td>
                  <td><span className="badge badge-primary">{acc.accountType}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--green)' }}>₹{parseFloat(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className={`badge ${acc.active ? 'badge-success' : 'badge-danger'}`}>{acc.active ? 'Active' : 'Closed'}</span>
                      {acc.deletionRequested && <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Deletion Pending</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className={`btn btn-sm ${acc.active ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggleAccount(acc.id)}>{acc.active ? 'Freeze' : 'Activate'}</button>
                      <button className="btn btn-sm btn-secondary" onClick={() => { setSelectedAccount(acc); setAdjustAmount(acc.balance); setShowAdjustBalance(true); }}>Adjust</button>
                      <button className="btn btn-sm btn-danger" style={{ display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleDeleteAccount(acc.id)}><RiDeleteBin5Line /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========== TRANSACTIONS TAB ========== */}
      {tab === 'transactions' && (
        <div>
          <div className="glass-card" style={{ marginBottom: 16, padding: '12px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <RiSearchLine style={{ color: 'var(--text-muted)' }} />
              <input className="form-control" placeholder="Search by transaction ID, type, or user name..." value={txSearch} onChange={e => setTxSearch(e.target.value)} style={{ border: 'none', boxShadow: 'none', padding: '8px 0' }} />
            </div>
          </div>
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <div style={{ marginBottom: 12, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {filteredTx.length} transaction{filteredTx.length !== 1 ? 's' : ''}
            </div>
            <table className="data-table">
              <thead><tr><th>Transaction ID</th><th>Type</th><th>From</th><th>To</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {filteredTx.map(tx => (
                  <tr key={tx.id}>
                    <td style={{ fontWeight: 500, fontSize: '0.8rem' }}>{tx.transactionId}</td>
                    <td><span className="badge badge-info">{tx.type}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {tx.fromAccount ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{tx.fromAccount.userName || ''}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{tx.fromAccount.accountNumber}</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {tx.toAccount ? (
                        <div>
                          <div style={{ fontWeight: 500 }}>{tx.toAccount.userName || ''}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{tx.toAccount.accountNumber}</div>
                        </div>
                      ) : '—'}
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '0.9rem' }}>₹{parseFloat(tx.amount).toLocaleString('en-IN')}</td>
                    <td><span className={`badge ${tx.status === 'COMPLETED' ? 'badge-success' : tx.status === 'FAILED' ? 'badge-danger' : 'badge-warning'}`}>{tx.status}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTx.length === 0 && <div className="empty-state"><p>No transactions found</p></div>}
          </div>
        </div>
      )}

      {/* ========== LOANS TAB ========== */}
      {tab === 'loans' && (
        <div>
          {/* Loan Interest Rate Configuration */}
          <div className="glass-card" style={{ marginBottom: 20 }}>
            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><RiPercentLine /> Bank Interest Rate Configuration</h3>
            {rateMsg && <div className={rateMsg.includes('success') ? 'success-message' : 'error-message'}>{rateMsg}</div>}
            <form onSubmit={handleSetRate} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ marginBottom: 0, minWidth: 140 }}>
                <label>Loan Type</label>
                <select className="form-control" value={rateForm.loanType} onChange={e => setRateForm({ ...rateForm, loanType: e.target.value })}>
                  {['Personal', 'Home', 'Education', 'Vehicle', 'Business'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0, minWidth: 120 }}>
                <label>Interest Rate (%)</label>
                <input type="number" step="0.01" className="form-control" value={rateForm.interestRate} onChange={e => setRateForm({ ...rateForm, interestRate: e.target.value })} required placeholder="e.g. 10.5" />
              </div>
              <div className="form-group" style={{ marginBottom: 0, minWidth: 120 }}>
                <label>Min Amount (₹)</label>
                <input type="number" className="form-control" value={rateForm.minAmount} onChange={e => setRateForm({ ...rateForm, minAmount: e.target.value })} placeholder="10000" />
              </div>
              <div className="form-group" style={{ marginBottom: 0, minWidth: 120 }}>
                <label>Max Amount (₹)</label>
                <input type="number" className="form-control" value={rateForm.maxAmount} onChange={e => setRateForm({ ...rateForm, maxAmount: e.target.value })} placeholder="5000000" />
              </div>
              <div className="form-group" style={{ marginBottom: 0, minWidth: 100 }}>
                <label>Min Term</label>
                <input type="number" className="form-control" value={rateForm.minTermMonths} onChange={e => setRateForm({ ...rateForm, minTermMonths: e.target.value })} placeholder="6" />
              </div>
              <div className="form-group" style={{ marginBottom: 0, minWidth: 100 }}>
                <label>Max Term</label>
                <input type="number" className="form-control" value={rateForm.maxTermMonths} onChange={e => setRateForm({ ...rateForm, maxTermMonths: e.target.value })} placeholder="360" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginBottom: 0 }}>Set Rate</button>
            </form>
            {loanRates.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <table className="data-table">
                  <thead><tr><th>Loan Type</th><th>Interest Rate</th><th>Min Amount</th><th>Max Amount</th><th>Term Range</th><th>Updated</th></tr></thead>
                  <tbody>
                    {loanRates.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.loanType}</td>
                        <td><span className="badge badge-primary">{parseFloat(r.interestRate).toFixed(2)}%</span></td>
                        <td>{r.minAmount ? `₹${parseFloat(r.minAmount).toLocaleString('en-IN')}` : '—'}</td>
                        <td>{r.maxAmount ? `₹${parseFloat(r.maxAmount).toLocaleString('en-IN')}` : '—'}</td>
                        <td>{r.minTermMonths || '—'} - {r.maxTermMonths || '—'} months</td>
                        <td style={{ fontSize: '0.8rem' }}>{r.updatedAt ? new Date(r.updatedAt).toLocaleDateString('en-IN') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* All Loans */}
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <h3 className="section-title">All Loan Applications</h3>
            <table className="data-table">
              <thead><tr><th>Loan ID</th><th>Applicant</th><th>Type</th><th>Amount</th><th>Rate</th><th>Term</th><th>EMI</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {allLoans.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 500 }}>{l.loanId}</td>
                    <td>{l.user ? `${l.user.firstName} ${l.user.lastName}` : '—'}</td>
                    <td><span className="badge badge-info">{l.loanType}</span></td>
                    <td style={{ fontWeight: 600 }}>₹{parseFloat(l.amount).toLocaleString('en-IN')}</td>
                    <td>{parseFloat(l.interestRate).toFixed(2)}%</td>
                    <td>{l.termMonths}m</td>
                    <td>₹{parseFloat(l.emi).toLocaleString('en-IN')}</td>
                    <td><span className={`badge ${l.status === 'APPROVED' ? 'badge-success' : l.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>{l.status}</span></td>
                    <td>
                      {l.status === 'PENDING' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-success" onClick={() => handleApproveLoan(l.id)}>Approve</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleRejectLoan(l.id)}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allLoans.length === 0 && <div className="empty-state"><p>No loan applications</p></div>}
          </div>
        </div>
      )}

      {/* ========== DELETION REQUESTS TAB ========== */}
      {tab === 'deletionRequests' && (
        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Account Number</th><th>User Details</th><th>Type</th><th>Balance</th><th>Actions</th></tr></thead>
            <tbody>
              {deletionRequests.map(acc => (
                <tr key={acc.id}>
                  <td style={{ fontWeight: 600 }}>{acc.accountNumber}</td>
                  <td>
                    {acc.user ? (
                      <div>
                        <div style={{ fontWeight: 500 }}>{acc.user.firstName} {acc.user.lastName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{acc.user.email}</div>
                      </div>
                    ) : '—'}
                  </td>
                  <td><span className="badge badge-primary">{acc.accountType}</span></td>
                  <td style={{ fontWeight: 700 }}>₹{parseFloat(acc.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm btn-danger" onClick={() => handleApproveDeletion(acc.id)}>Approve Deletion</button>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleRejectDeletion(acc.id)}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
              {deletionRequests.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0' }}>No pending deletion requests</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========== TICKETS TAB ========== */}
      {tab === 'tickets' && (
        <div className="glass-card" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Ticket</th><th>User</th><th>Subject</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500 }}>{t.ticketNumber}</td>
                  <td>{t.userName}</td>
                  <td>{t.subject}</td>
                  <td><span className={`badge ${t.status === 'RESOLVED' ? 'badge-success' : 'badge-warning'}`}>{t.status}</span></td>
                  <td>{t.status !== 'RESOLVED' && <button className="btn btn-sm btn-primary" onClick={() => handleResolve(t.id)}>Resolve</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========== MODALS ========== */}
      {showAdjustBalance && selectedAccount && (
        <div className="modal-overlay" onClick={() => { setShowAdjustBalance(false); setSelectedAccount(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Adjust Account Balance</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
              Updating balance for Account: <strong>{selectedAccount.accountNumber}</strong>
            </p>
            <form onSubmit={handleAdjustBalanceSubmit}>
              <div className="form-group">
                <label>New Balance (₹)</label>
                <input type="number" step="0.01" className="form-control" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAdjustBalance(false); setSelectedAccount(null); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUserDetail && (
        <div className="modal-overlay" onClick={() => setShowUserDetail(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>User Details — {users.find(u => u.id === showUserDetail)?.firstName} {users.find(u => u.id === showUserDetail)?.lastName}</h2>
            
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: 16, marginBottom: 10 }}>Accounts</h3>
            {userAccounts.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No accounts</p> : (
              <table className="data-table">
                <thead><tr><th>Account</th><th>Type</th><th>Balance</th><th>Status</th></tr></thead>
                <tbody>
                  {userAccounts.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 500 }}>{a.accountNumber}</td>
                      <td><span className="badge badge-primary">{a.accountType}</span></td>
                      <td style={{ fontWeight: 700, color: 'var(--green)' }}>₹{parseFloat(a.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td><span className={`badge ${a.active ? 'badge-success' : 'badge-danger'}`}>{a.active ? 'Active' : 'Closed'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: 20, marginBottom: 10 }}>Recent Transactions</h3>
            {userTransactions.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No transactions</p> : (
              <table className="data-table">
                <thead><tr><th>ID</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {userTransactions.slice(0, 10).map(tx => (
                    <tr key={tx.id}>
                      <td style={{ fontSize: '0.8rem' }}>{tx.transactionId}</td>
                      <td><span className="badge badge-info">{tx.type}</span></td>
                      <td style={{ fontWeight: 600 }}>₹{parseFloat(tx.amount).toLocaleString('en-IN')}</td>
                      <td><span className={`badge ${tx.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>{tx.status}</span></td>
                      <td style={{ fontSize: '0.8rem' }}>{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowUserDetail(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
