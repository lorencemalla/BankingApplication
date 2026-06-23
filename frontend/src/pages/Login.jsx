import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { RiShieldCheckLine, RiLockLine, RiMailLine, RiErrorWarningLine } from 'react-icons/ri';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailNotVerified(false);
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      login(res.data.data);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      if (msg === 'EMAIL_NOT_VERIFIED') {
        setEmailNotVerified(true);
      } else {
        setError(msg);
      }
    } finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      await authAPI.resendOtp({ email: form.email });
      navigate('/register', { state: { email: form.email, step: 'verify' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally { setResending(false); }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-section">
          <div className="logo-icon">NB</div>
          <h1>Internet Banking Login</h1>
          <p className="subtitle">Secure access to your NexusBank account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {emailNotVerified && (
          <div style={{ background: 'var(--yellow-light)', border: '1px solid #fcd34d', borderLeft: '3px solid var(--yellow)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <RiErrorWarningLine style={{ color: 'var(--yellow)', fontSize: '1.1rem' }} />
              <strong style={{ color: '#92400e', fontSize: '0.85rem' }}>Email Not Verified</strong>
            </div>
            <p style={{ color: '#92400e', fontSize: '0.8rem', margin: '0 0 10px', lineHeight: 1.5 }}>
              Your email address has not been verified. Please verify your email to continue.
            </p>
            <button onClick={handleResendOtp} disabled={resending}
              style={{ background: '#92400e', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              {resending ? 'Sending OTP...' : 'Resend Verification OTP →'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Registered Email ID</label>
            <div style={{ position: 'relative' }}>
              <input type="email" className="form-control" style={{ paddingLeft: 40 }}
                placeholder="Enter your email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
              <RiMailLine style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.05rem' }} />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input type="password" className="form-control" style={{ paddingLeft: 40 }}
                placeholder="Enter your password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required />
              <RiLockLine style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.05rem' }} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            {loading ? 'Authenticating...' : 'Login Securely'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 20, padding: '10px', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
          <RiShieldCheckLine style={{ color: 'var(--green)', fontSize: '1rem' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>256-bit SSL Encrypted • RBI Regulated</span>
        </div>

        <p className="auth-link">New to NexusBank? <Link to="/register">Open an Account</Link></p>
      </div>
    </div>
  );
};

export default Login;
