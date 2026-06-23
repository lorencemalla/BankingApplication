import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (data) => api.post('/auth/resend-otp', data),
};

// Accounts
export const accountAPI = {
  getAll: () => api.get('/accounts'),
  getByNumber: (num) => api.get(`/accounts/${num}`),
  create: (data) => api.post('/accounts', data),
  requestDeletion: (num) => api.put(`/accounts/${num}/request-deletion`),
};

// Transactions
export const transactionAPI = {
  transfer: (data) => api.post('/transactions/transfer', data),
  deposit: (data) => api.post('/transactions/deposit', data),
  withdraw: (data) => api.post('/transactions/withdraw', data),
  getHistory: () => api.get('/transactions/history'),
  getMiniStatement: (accNum) => api.get(`/transactions/mini-statement/${accNum}`),
  getStatement: (start, end) => api.get(`/transactions/statement?startDate=${start}&endDate=${end}`),
  getRecentActivity: () => api.get('/transactions/recent-activity'),
};

// Beneficiaries
export const beneficiaryAPI = {
  getAll: () => api.get('/beneficiaries'),
  add: (data) => api.post('/beneficiaries', data),
  remove: (id) => api.delete(`/beneficiaries/${id}`),
};

// Bills
export const billAPI = {
  pay: (data) => api.post('/bills/pay', data),
  getHistory: () => api.get('/bills/history'),
};

// Cards
export const cardAPI = {
  getAll: () => api.get('/cards'),
  create: (data) => api.post('/cards', data),
  toggleBlock: (id) => api.put(`/cards/${id}/toggle-block`),
  changePin: (id, data) => api.put(`/cards/${id}/change-pin`, data),
};

// Loans
export const loanAPI = {
  getAll: () => api.get('/loans'),
  apply: (data) => api.post('/loans/apply', data),
  calculateEMI: (amount, rate, term) => api.get(`/loans/emi-calculator?amount=${amount}&rate=${rate}&termMonths=${term}`),
  getRates: () => api.get('/loans/rates'),
};

// Notifications
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// Support
export const supportAPI = {
  getTickets: () => api.get('/support/tickets'),
  createTicket: (data) => api.post('/support/tickets', data),
  getTicket: (num) => api.get(`/support/tickets/${num}`),
};

// Profile
export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  changePassword: (data) => api.put('/profile/change-password', data),
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  getUserTransactions: (id) => api.get(`/admin/users/${id}/transactions`),
  getUserAccounts: (id) => api.get(`/admin/users/${id}/accounts`),
  getTickets: () => api.get('/admin/tickets'),
  resolveTicket: (id, data) => api.put(`/admin/tickets/${id}/resolve`, data),
  getAllLoans: () => api.get('/admin/loans'),
  getPendingLoans: () => api.get('/admin/loans/pending'),
  approveLoan: (id) => api.put(`/admin/loans/${id}/approve`),
  rejectLoan: (id) => api.put(`/admin/loans/${id}/reject`),
  getLoanRates: () => api.get('/admin/loan-rates'),
  setLoanRate: (data) => api.post('/admin/loan-rates', data),
  deleteLoanRate: (id) => api.delete(`/admin/loan-rates/${id}`),
  getAccounts: () => api.get('/admin/accounts'),
  toggleAccountStatus: (id) => api.put(`/admin/accounts/${id}/toggle-status`),
  adjustAccountBalance: (id, data) => api.put(`/admin/accounts/${id}/adjust-balance`, data),
  deleteAccount: (id) => api.delete(`/admin/accounts/${id}`),
  getDeletionRequests: () => api.get('/admin/accounts/deletion-requests'),
  approveDeletion: (id) => api.put(`/admin/accounts/${id}/approve-deletion`),
  rejectDeletion: (id) => api.put(`/admin/accounts/${id}/reject-deletion`),
  getAllTransactions: () => api.get('/admin/transactions'),
};

export default api;
