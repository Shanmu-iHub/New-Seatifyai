import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { GraduationCap, Mail, Phone, ArrowRight, RefreshCw } from 'lucide-react';
import axios from 'axios';

export default function LoginPage() {
  const [mode, setMode] = useState('email'); // 'email' | 'mobile'
  const [step, setStep] = useState(1); // 1=enter contact, 2=enter OTP
  const [contact, setContact] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [name, setName] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!contact) return toast.error('Please enter your contact');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/send-otp', { contact, type: mode });
      setIsNewUser(res.data.isNewUser);
      setStep(2);
      toast.success('OTP sent successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
    if (!val && idx > 0) document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length !== 6) return toast.error('Please enter the complete OTP');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-otp', { contact, type: mode, otp: otpStr, name: isNewUser ? name : undefined });
      login(res.data.user, res.data.token);
      toast.success('Welcome to Seatifyai!');
      
      const destination = location.state?.from || '/courses';
      navigate(destination, { 
        state: { 
          course: location.state?.course, 
          program: location.state?.program 
        } 
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #4F46E5, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-8 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7C3AED, transparent)' }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-up">
          <img 
            src="http://k12.seatifyai.com/wp-content/uploads/2025/04/Logo-Seatifyai-scaled.webp" 
            alt="Seatifyai" 
            className="mx-auto mb-4"
            style={{ height: '126px', width: 'auto' }}
          />
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Smart Admission Portal — Secure & Simple
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 animate-fade-up" style={{
          background: 'var(--card)', border: '1px solid var(--card-border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)', animationDelay: '0.1s'
        }}>
          {step === 1 ? (
            <>
              <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Clash Display' }}>Sign In / Register</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Enter your contact to receive an OTP</p>

              {/* Mode toggle */}
              <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(255,255,255,0.05)' }}>
                {[{ id: 'email', label: 'Email', icon: Mail }, { id: 'mobile', label: 'Mobile', icon: Phone }].map(({ id, label, icon: Icon }) => (
                  <button key={id} onClick={() => { setMode(id); setContact(''); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{ background: mode === id ? 'var(--primary)' : 'transparent', color: mode === id ? '#fff' : 'var(--text-muted)' }}>
                    <Icon size={15} /> {label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendOtp}>
                <div className="mb-5">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    {mode === 'email' ? 'Email Address' : 'Mobile Number'}
                  </label>
                  <input
                    type={mode === 'email' ? 'email' : 'tel'}
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    placeholder={mode === 'email' ? 'student@email.com' : '+91 98765 43210'}
                    className="w-full rounded-xl px-4 py-3 text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'var(--text)' }}
                    required
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all"
                  style={{ background: 'var(--primary)', color: '#fff', opacity: loading ? 0.7 : 1 }}>
                  {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
                    : <><span>Send OTP</span><ArrowRight size={16} /></>}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => { setStep(1); setOtp(['','','','','','']); }}
                  className="text-sm" style={{ color: 'var(--primary)' }}>← Back</button>
                <div>
                  <h2 className="text-xl font-bold" style={{ fontFamily: 'Clash Display' }}>Verify OTP</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sent to {contact}</p>
                </div>
              </div>

              {isNewUser && (
                <div className="mb-5">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"
                    className="w-full rounded-xl px-4 py-3 text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)', color: 'var(--text)' }} />
                </div>
              )}

              <form onSubmit={handleVerifyOtp}>
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Enter 6-digit OTP <span className="text-xs" style={{ color: 'var(--primary)' }}>(Temp OTP: 123456)</span></label>
                <div className="flex gap-2 mb-6">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx} id={`otp-${idx}`} type="text" inputMode="numeric"
                      value={digit} onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => e.key === 'Backspace' && !digit && idx > 0 && document.getElementById(`otp-${idx-1}`)?.focus()}
                      maxLength={1}
                      className="flex-1 text-center text-lg font-bold rounded-xl py-3"
                      style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${digit ? 'var(--primary)' : 'var(--card-border)'}`, color: 'var(--text)' }}
                    />
                  ))}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                  style={{ background: 'var(--primary)', color: '#fff', opacity: loading ? 0.7 : 1 }}>
                  {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying...</>
                    : <><span>Verify & Continue</span><ArrowRight size={16} /></>}
                </button>
                <button type="button" onClick={handleSendOtp}
                  className="w-full mt-3 flex items-center justify-center gap-1 text-sm py-2"
                  style={{ color: 'var(--text-muted)' }}>
                  <RefreshCw size={13} /> Resend OTP
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          By continuing, you agree to our Terms of Service & Privacy Policy
        </p>
      </div>
    </div>
  );
}
