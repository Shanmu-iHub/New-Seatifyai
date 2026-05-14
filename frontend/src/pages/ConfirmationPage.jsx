import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Download, User, Home } from 'lucide-react';

export default function ConfirmationPage() {
  const { applicationId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  const application = state?.application;
  const course = state?.course;
  const program = state?.program;
  const paymentId = state?.paymentId;

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const details = [
    ['Application ID', applicationId],
    ['Student Name', application?.fullName || 'N/A'],
    ['Course', course?.name || 'N/A'],
    ['Program', program?.name || 'N/A'],
    ['Amount Paid', `₹${(program?.fee || 0).toLocaleString('en-IN')}`],
    ['Payment ID', paymentId || 'N/A'],
    ['Date & Time', `${dateStr} at ${timeStr}`],
    ['Status', 'Confirmed ✓'],
  ];

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-md mx-auto">

        {/* Animated check */}
        <div className={`text-center mb-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
              style={{ background: 'rgba(16,185,129,0.15)', animation: 'pulse-ring 2s infinite' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.25)' }}>
                <CheckCircle size={40} style={{ color: '#10B981' }} />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Clash Display', color: '#10B981' }}>
            Application Confirmed!
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Your admission has been successfully registered. A confirmation email has been sent.
          </p>
        </div>

        {/* Details card */}
        <div className={`rounded-2xl p-6 mb-5 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Admission Details
          </h2>
          <div className="space-y-3">
            {details.map(([label, val]) => (
              <div key={label} className="flex justify-between items-start gap-4">
                <span className="text-sm flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className={`text-sm font-medium text-right ${label === 'Status' ? 'text-green-400' : ''} ${label === 'Application ID' ? 'font-mono text-indigo-400' : ''}`}>
                  {val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className={`flex flex-col gap-3 transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--primary)', color: '#fff' }}>
            <User size={16} /> Go to My Profile
          </button>
          <button
            onClick={() => navigate('/courses')}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'var(--card)', border: '1px solid var(--card-border)', color: 'var(--text)' }}>
            <Home size={16} /> Back to Courses
          </button>
          <button
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10B981' }}
            onClick={() => toast.info('Receipt will be sent to your email')}>
            <Download size={16} /> Download Receipt
          </button>
        </div>

        {/* Note */}
        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Keep your Application ID <span style={{ color: 'var(--primary)' }}>{applicationId}</span> safe for future reference.
        </p>
      </div>
    </div>
  );
}
