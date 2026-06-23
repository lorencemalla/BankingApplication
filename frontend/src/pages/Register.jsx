import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { RiMailCheckLine, RiTimerLine, RiRefreshLine } from 'react-icons/ri';

const Register = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('register'); // 'register' or 'verify'
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();
  const otpRefs = useRef([]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.register(form);
      setStep('verify');
      setResendCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) { setError('Please enter the complete 6-digit OTP'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.verifyOtp({ email: form.email, otp: otpString });
      login(res.data.data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    try {
      await authAPI.resendOtp({ email: form.email });
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  const update = (field, value) => setForm({ ...form, [field]: value });

  // OTP Verification Screen
  if (step === 'verify') {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="logo-section">
            <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #059669, #34d399)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 4px 16px rgba(5,150,105,0.35)' }}>
              <RiMailCheckLine style={{ fontSize: 28, color: '#fff' }} />
            </div>
            <h1>Verify Your Email</h1>
            <p className="subtitle">We've sent a 6-digit OTP to</p>
            <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.95rem', marginTop: 4 }}>{form.email}</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleVerify}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '20px 0 24px' }} onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input key={i} type="text" inputMode="numeric" maxLength={1} value={digit}
                  ref={el => otpRefs.current[i] = el}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  style={{
                    width: 48, height: 56, textAlign: 'center', fontSize: '1.4rem', fontWeight: 700,
                    border: digit ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', outline: 'none', fontFamily: 'Inter, sans-serif',
                    background: digit ? 'var(--primary-light)' : '#fff',
                    transition: 'all 0.2s ease', color: 'var(--text-dark)'
                  }}
                  onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={e => { if (!digit) e.target.style.borderColor = 'var(--border)'; }}
                />
              ))}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 13 }} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <RiTimerLine />
            <span>OTP valid for 10 minutes</span>
          </div>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            {resendCooldown > 0 ? (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Resend OTP in <strong style={{ color: 'var(--primary)' }}>{resendCooldown}s</strong>
              </span>
            ) : (
              <button onClick={handleResendOtp}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'Inter, sans-serif' }}>
                <RiRefreshLine /> Resend OTP
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Registration Form
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-section">
          <div className="logo-icon">NB</div>
          <h1>Create Account</h1>
          <p className="subtitle">Join NexusBank and start banking digitally</p>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleRegister}>
          <div className="grid-2">
            <div className="form-group">
              <label>First Name</label>
              <input className="form-control" placeholder="John" value={form.firstName} onChange={e => update('firstName', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input className="form-control" placeholder="Doe" value={form.lastName} onChange={e => update('lastName', e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-control" placeholder="john@example.com" value={form.email} onChange={e => update('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-control" placeholder="Minimum 6 characters" value={form.password} onChange={e => update('password', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input className="form-control" placeholder="+91 9876543210" value={form.phone} onChange={e => update('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input className="form-control" placeholder="Your address" value={form.address} onChange={e => update('address', e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Sign In</Link></p>
      </div>
    </div>
  );
};

export default Register;
