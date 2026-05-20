import React, { useState, useEffect } from 'react';
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
  const [devOtpHint, setDevOtpHint] = useState('');
  const [timer, setTimer] = useState(30);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Auto-focus the first OTP input box when step becomes 2
  useEffect(() => {
    if (step === 2) {
      const focusTimer = setTimeout(() => {
        const firstInput = document.getElementById('otp-0');
        if (firstInput) {
          firstInput.focus();
        }
      }, 50);
      return () => clearTimeout(focusTimer);
    }
  }, [step]);

  const handleContactChange = (val) => {
    setContact(val);
    const isEmail = val.includes('@') || /[a-zA-Z]/.test(val);
    setMode(isEmail ? 'email' : 'mobile');
  };

  const handleSendOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!contact) return toast.error('Please enter your contact');

    const isEmail = contact.includes('@') || /[a-zA-Z]/.test(contact);
    if (isEmail) {
      if (!contact.includes('@') || contact.length < 5) {
        return toast.error('Please enter a valid email address');
      }
    } else {
      const cleanNum = contact.replace(/\D/g, '');
      if (cleanNum.length !== 10) {
        return toast.error('Please enter a valid 10-digit mobile number');
      }
    }

    setLoading(true);
    try {
      const sendContact = isEmail ? contact : contact.replace(/\D/g, '').slice(0, 10);
      const res = await axios.post('/api/auth/send-otp', { contact: sendContact, type: isEmail ? 'email' : 'mobile' });
      setIsNewUser(res.data.isNewUser);
      setStep(2);
      setTimer(30); // Reset timer to 30s
      if (res.data.devOtp) {
        setDevOtpHint(res.data.devOtp);
        toast.success(`Development Mode: OTP is ${res.data.devOtp}`);
      } else {
        toast.success('OTP sent successfully!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (idx, val) => {
    // If user pasted/autofilled multiple characters directly
    if (val.length > 1) {
      const digits = val.replace(/\D/g, '').slice(0, 6 - idx);
      if (digits) {
        const newOtp = [...otp];
        for (let i = 0; i < digits.length; i++) {
          if (idx + i < 6) {
            newOtp[idx + i] = digits[i];
          }
        }
        setOtp(newOtp);
        const nextFocus = Math.min(idx + digits.length, 5);
        document.getElementById(`otp-${nextFocus}`)?.focus();
      }
      return;
    }

    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[idx] = val;
    setOtp(newOtp);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
    if (!val && idx > 0) document.getElementById(`otp-${idx - 1}`)?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    if (!digits) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      if (digits[i] !== undefined) {
        newOtp[i] = digits[i];
      }
    }
    setOtp(newOtp);

    // Focus last or next input
    const focusIndex = Math.min(digits.length, 5);
    document.getElementById(`otp-${focusIndex}`)?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length !== 6) return toast.error('Please enter the complete OTP');
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/verify-otp', { contact, type: mode, otp: otpStr });
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
            src="/logo.webp" 
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

              <form onSubmit={handleSendOtp}>

                <div className="mb-5">
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                    Mobile Number or Email Address
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={e => handleContactChange(e.target.value)}
                    placeholder="9876543210 or student@gmail.com"
                    className="w-full rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                    style={{ background: '#fff', border: '1px solid var(--card-border)', color: 'var(--text)' }}
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
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Sent to {contact}</p>
                    <button
                      type="button"
                      onClick={() => { setStep(1); setOtp(['','','','','','']); }}
                      className="text-xs font-semibold hover:underline animate-fade-up"
                      style={{ color: 'var(--primary)', background: 'none', border: 'none', padding: 0 }}
                    >
                      (Edit)
                    </button>
                  </div>
                </div>
              </div>

              {devOtpHint && (
                <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100 animate-pulse">
                  <p className="text-xs text-blue-700 font-bold mb-1">DEVELOPMENT MODE</p>
                  <p className="text-sm text-blue-900">Your OTP is: <span className="font-mono font-black text-lg">{devOtpHint}</span></p>
                </div>
              )}



              <form onSubmit={handleVerifyOtp}>
                <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Enter 6-digit OTP</label>
                <div className="flex gap-2 mb-6">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx} id={`otp-${idx}`} type="text" inputMode="numeric"
                      value={digit} onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => e.key === 'Backspace' && !digit && idx > 0 && document.getElementById(`otp-${idx-1}`)?.focus()}
                      onPaste={handlePaste}
                      maxLength={1}
                      className="w-full text-center text-lg font-bold rounded-xl py-3 min-w-0"
                      style={{ background: '#fff', border: `1.5px solid ${digit ? 'var(--primary)' : 'var(--card-border)'}`, color: 'var(--text)' }}
                    />
                  ))}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
                  style={{ background: 'var(--primary)', color: '#fff', opacity: loading ? 0.7 : 1 }}>
                  {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying...</>
                    : <><span>Verify & Continue</span><ArrowRight size={16} /></>}
                </button>
                <button 
                  type="button" 
                  disabled={timer > 0 || loading}
                  onClick={handleSendOtp}
                  className="w-full mt-3 flex items-center justify-center gap-1 text-sm py-2 transition-all"
                  style={{ 
                    color: timer > 0 ? 'var(--text-muted)' : 'var(--primary)',
                    opacity: (timer > 0 || loading) ? 0.5 : 1,
                    cursor: (timer > 0 || loading) ? 'not-allowed' : 'pointer',
                    fontWeight: timer > 0 ? 'normal' : 'bold'
                  }}
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> 
                  {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
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
