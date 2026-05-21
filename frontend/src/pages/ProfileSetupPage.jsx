import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Calendar, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function ProfileSetupPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailChecking, setEmailChecking] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [mobileChecking, setMobileChecking] = useState(false);

  useEffect(() => {
    if (!email.trim() || !email.includes('@')) {
      setEmailError('');
      return;
    }

    // Skip checking if it is the user's current email
    if (user && email.trim().toLowerCase() === (user.email || '').toLowerCase()) {
      setEmailError('');
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const res = await axios.get(`/api/students/check-email?email=${encodeURIComponent(email.trim())}`);
        if (res.data.exists) {
          setEmailError('Email already exists');
        } else {
          setEmailError('');
        }
      } catch (err) {
        console.error('Error checking email availability:', err);
      } finally {
        setEmailChecking(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [email, user]);

  useEffect(() => {
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      setMobileError('');
      return;
    }

    // Skip checking if it is the user's current mobile number
    if (user && cleanMobile === (user.mobile || '')) {
      setMobileError('');
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setMobileChecking(true);
      try {
        const res = await axios.get(`/api/students/check-mobile?mobile=${cleanMobile}`);
        if (res.data.exists) {
          setMobileError('Mobile number already exists');
        } else {
          setMobileError('');
        }
      } catch (err) {
        console.error('Error checking mobile availability:', err);
      } finally {
        setMobileChecking(false);
      }
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [mobile, user]);

  useEffect(() => {
    if (user) {
      setName(user.name === 'Student' ? '' : (user.name || ''));
      setEmail(user.email || '');
      setMobile(user.mobile || '');
      setDob(user.dob || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Please enter your full name');
    if (!email.trim() || !email.includes('@')) return toast.error('Please enter a valid email address');
    if (emailError) return toast.error(emailError);
    if (mobileError) return toast.error(mobileError);
    if (!mobile.trim() || mobile.replace(/\D/g, '').length !== 10) return toast.error('Please enter a valid 10-digit mobile number');
    if (!dob) return toast.error('Please select your date of birth');

    setLoading(true);
    try {
      const res = await axios.put('/api/students/profile', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        mobile: mobile.replace(/\D/g, '').slice(0, 10),
        dob
      });
      
      // Update local context
      updateUser(res.data.user);
      toast.success('Profile completed successfully!');
      
      // Redirect to courses
      navigate('/courses');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile details');
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
        {/* Logo / Header */}
        <div className="text-center mb-8 animate-fade-up">
          <img 
            src="/logo.webp" 
            alt="Seatifyai" 
            className="mx-auto mb-4"
            style={{ height: '126px', width: 'auto' }}
          />
          <h2 className="text-2xl font-black mt-2" style={{ fontFamily: 'Clash Display', color: 'var(--text)' }}>
            Complete Your Profile
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
            Please fill in these mandatory details to proceed to the courses
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl p-8 animate-fade-up" style={{
          background: 'var(--card)', border: '1px solid var(--card-border)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)', animationDelay: '0.1s'
        }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                  <User size={16} />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  style={{ background: '#fff', border: '1px solid var(--card-border)', color: 'var(--text)' }}
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  style={{ 
                    background: '#fff', 
                    border: emailError ? '1px solid #ef4444' : '1px solid var(--card-border)', 
                    color: 'var(--text)' 
                  }}
                  required
                />
              </div>
              {emailChecking && (
                <p className="mt-1 text-xs text-indigo-500 animate-pulse">
                  Checking email availability...
                </p>
              )}
              {emailError && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  {emailError}
                </p>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                  <Phone size={16} />
                </span>
                <input
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  maxLength={10}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  style={{ 
                    background: '#fff', 
                    border: mobileError ? '1px solid #ef4444' : '1px solid var(--card-border)', 
                    color: 'var(--text)' 
                  }}
                  required
                />
              </div>
              {mobileChecking && (
                <p className="mt-1 text-xs text-indigo-500 animate-pulse">
                  Checking mobile availability...
                </p>
              )}
              {mobileError && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  {mobileError}
                </p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                Date of Birth
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                  <Calendar size={16} />
                </span>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-4 focus:ring-blue-50 transition-all outline-none"
                  style={{ background: '#fff', border: '1px solid var(--card-border)', color: 'var(--text)' }}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full mt-6 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-indigo-500/20"
              style={{ background: 'var(--primary)', color: '#fff', opacity: loading ? 0.7 : 1 }}>
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <span>Save & Continue</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
