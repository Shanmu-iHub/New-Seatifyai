import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Calendar, Building2, BookOpen, CreditCard, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function AdmissionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/applications/my/admissions');
      setAdmissions(res.data);
    } catch (err) {
      toast.error('Failed to load admissions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isInactiveAdmission = (admission) => ['cancelled', 'rejected'].includes(admission.status);
  const isConfirmedAdmission = (admission) =>
    admission.paymentStatus === 'completed' && !isInactiveAdmission(admission);
  const isPaidCancelledAdmission = (admission) =>
    admission.paymentStatus === 'completed' && admission.status === 'cancelled';

  const hasActiveConfirmedAdmission = admissions.some(isConfirmedAdmission);
  const isBlockedByAdmissionLimit = (admission) =>
    hasActiveConfirmedAdmission &&
    !isConfirmedAdmission(admission) &&
    !isInactiveAdmission(admission) &&
    ['pending', 'pay_later', 'failed'].includes(admission.paymentStatus);

  const getStatusBadge = (admission) => {
    if (isBlockedByAdmissionLimit(admission)) {
      return { icon: AlertCircle, label: 'Cancelled', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
    }

    if (admission.status === 'cancelled') {
      return { icon: AlertCircle, label: 'Cancelled', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
    }

    if (admission.status === 'rejected') {
      return { icon: AlertCircle, label: 'Rejected', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    }

    switch (admission.paymentStatus) {
      case 'completed':
        return { icon: CheckCircle, label: 'Confirmed', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
      case 'pay_later':
        return { icon: Clock, label: 'Pay Later', bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
      case 'failed':
        return { icon: AlertCircle, label: 'Payment Failed', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
      case 'pending':
      default:
        return { icon: AlertCircle, label: 'Pending Payment', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    }
  };

  const handlePayNow = (admission) => {
    if (isInactiveAdmission(admission)) {
      toast.error('This application is cancelled and cannot be paid.');
      return;
    }

    if (hasActiveConfirmedAdmission) {
      toast.error('You already have a confirmed admission for this academic year.');
      return;
    }

    navigate(`/payment/${admission.applicationId}`, {
      state: { application: admission }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-10 pb-32 md:pb-10 px-4" style={{ background: 'var(--bg)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-10 pb-32 md:pb-10 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Clash Display' }}>My Admissions</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Track and manage all your course applications and payments
          </p>
        </div>

        {admissions.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
            <BookOpen size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              You haven't applied to any courses yet. Start by browsing available courses.
            </p>
            <button
              onClick={() => navigate('/courses')}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all"
              style={{ background: 'var(--primary)' }}
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {admissions.map((admission) => {
              const statusInfo = getStatusBadge(admission);
              const StatusIcon = statusInfo.icon;
              const canPay =
                !hasActiveConfirmedAdmission &&
                !isInactiveAdmission(admission) &&
                (admission.paymentStatus === 'pending' || admission.paymentStatus === 'pay_later' || admission.paymentStatus === 'failed');
              const blockedByLimit = isBlockedByAdmissionLimit(admission);
              const paidCancelled = isPaidCancelledAdmission(admission);

              return (
                <div
                  key={admission._id}
                  className="rounded-2xl p-6 transition-all hover:shadow-lg"
                  style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left Section */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(79,70,229,0.1)' }}>
                          <BookOpen size={24} style={{ color: 'var(--primary)' }} />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{admission.courseName}</h3>
                          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{admission.collegeName}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 size={16} style={{ color: 'var(--text-muted)' }} />
                          <span><span style={{ color: 'var(--text-muted)' }}>Program:</span> {admission.programName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CreditCard size={16} style={{ color: 'var(--text-muted)' }} />
                          <span><span style={{ color: 'var(--text-muted)' }}>Fee:</span> ₹{admission.fee?.toLocaleString('en-IN') || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                          <span><span style={{ color: 'var(--text-muted)' }}>Academic Year:</span> {admission.academicYear}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span><span style={{ color: 'var(--text-muted)' }}>App ID:</span> {admission.applicationId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Status & Action */}
                    <div className="flex flex-col items-start md:items-end gap-3 md:flex-shrink-0">
                      {/* Status Badge */}
                      <div
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}
                      >
                        <StatusIcon size={16} />
                        {statusInfo.label}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col w-full md:w-auto gap-2">
                        {canPay ? (
                          <>
                            <button
                              onClick={() => handlePayNow(admission)}
                              className="px-4 py-2 rounded-lg font-bold text-sm text-white transition-all whitespace-nowrap"
                              style={{
                                background: 'var(--primary)',
                                boxShadow: '0 2px 12px rgba(79,70,229,0.3)'
                              }}
                            >
                              Pay Now
                            </button>
                            {/* {admission.paymentStatus === 'pending' && (
                              <button
                                onClick={async () => {
                                  try {
                                    await axios.post(`/api/applications/${admission.applicationId}/pay-later`);
                                    toast.success('Marked as Pay Later');
                                    fetchAdmissions();
                                  } catch (err) {
                                    toast.error('Failed to update status');
                                  }
                                }}
                                className="px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap"
                                style={{
                                  background: 'rgba(79,70,229,0.1)',
                                  color: 'var(--primary)',
                                  border: '1px solid rgba(79,70,229,0.25)'
                                }}
                              >
                                Pay Later
                              </button>
                            )} */}
                          </>
                        ) : isConfirmedAdmission(admission) ? (
                          <button
                            onClick={() => navigate(`/confirmation/${admission.applicationId}`)}
                            className="px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap"
                            style={{
                              background: 'rgba(16,185,129,0.1)',
                              color: '#10B981',
                              border: '1px solid rgba(16,185,129,0.25)'
                            }}
                          >
                            View Details
                          </button>
                        ) : paidCancelled ? (
                          <button
                            onClick={() => navigate(`/cancel-booking/${admission.applicationId}`, { state: { application: admission } })}
                            className="px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap"
                            style={{
                              background: 'rgba(239,68,68,0.08)',
                              color: '#EF4444',
                              border: '1px solid rgba(239,68,68,0.2)'
                            }}
                          >
                            View Details
                          </button>
                        ) : blockedByLimit ? (
                          <p className="max-w-[220px] text-xs font-semibold text-right text-slate-500">
                            You have reached the limit for this year.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
