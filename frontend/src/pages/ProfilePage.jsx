import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { User, BookOpen, CreditCard, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const TABS = ['Overview', 'Admissions'];

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [profile, setProfile] = useState(null);
  const [admissions, setAdmissions] = useState([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/students/profile');
      setProfile(res.data.profile);
      setAdmissions(res.data.admissions || []);
    } catch (err) {
      console.error(err);
      toast.error('Could not load profile history');
    }
  };

  const StatusBadge = ({ status }) => {
    const cfg = {
      confirmed: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle, label: 'Confirmed' },
      pending: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: Clock, label: 'Pending' },
      rejected: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: AlertCircle, label: 'Rejected' },
    }[status?.toLowerCase()] || { color: '#9CA3AF', bg: 'rgba(156,163,175,0.12)', icon: Clock, label: status };
    const Icon = cfg.icon;
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{ background: cfg.bg, color: cfg.color }}>
        <Icon size={11} /> {cfg.label}
      </span>
    );
  };

  const Field = ({ label, value }) => (
    <div>
      <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-sm font-medium">{value || '—'}</p>
    </div>
  );

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-3xl mx-auto">

        {/* Profile Header */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
              style={{ background: 'var(--primary)' }}>
              {(profile?.fullName || user?.name || 'S')[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ fontFamily: 'Clash Display' }}>
                {profile?.fullName || user?.name || 'Student'}
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{profile?.email || user?.email}</p>
              {admissions.length > 0 && (
                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs"
                  style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                  <CheckCircle size={10} /> Enrolled
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto tabs-scroll">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: activeTab === tab ? 'var(--primary)' : 'var(--card)',
                color: activeTab === tab ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${activeTab === tab ? 'var(--primary)' : 'var(--card-border)'}`,
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          {activeTab === 'Overview' && (
            <>
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ fontFamily: 'Clash Display' }}>
                <User size={18} style={{ color: 'var(--primary)' }} /> Personal Information
              </h2>
              {profile ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" value={profile.fullName} />
                  <Field label="Email" value={profile.email} />
                  <Field label="Mobile" value={profile.mobile} />
                  <Field label="Date of Birth" value={profile.dob} />
                  <Field label="Gender" value={profile.gender} />
                  <Field label="Community" value={profile.community} />
                  <Field label="City" value={profile.city} />
                  <Field label="State" value={profile.state} />
                  <Field label="Nationality" value={profile.nationality} />
                  <Field label="Aadhar Number" value={profile.aadhar ? '••••••••' + profile.aadhar.slice(-4) : '—'} />
                </div>
              ) : (
                <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  <User size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No profile data found. Complete your application to see details here.</p>
                </div>
              )}
            </>
          )}



          {activeTab === 'Admissions' && (
            <>
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ fontFamily: 'Clash Display' }}>
                <CreditCard size={18} style={{ color: 'var(--primary)' }} /> Admission History
              </h2>
              {admissions.length > 0 ? (
                <div className="space-y-4">
                  {admissions.map(adm => (
                    <div key={adm._id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)' }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold">{adm.courseName}</p>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{adm.programName}</p>
                        </div>
                        <StatusBadge status={adm.status} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Field label="Application ID" value={adm.applicationId} />
                        <Field label="Amount Paid" value={`₹${adm.fee?.toLocaleString('en-IN')}`} />
                        <Field label="Payment ID" value={adm.paymentId} />
                        <Field label="Date" value={adm.createdAt ? new Date(adm.createdAt).toLocaleDateString('en-IN') : ''} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  <CreditCard size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No admission records found.</p>
                  <p className="text-sm mt-1">Apply for a course to see your records here.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
