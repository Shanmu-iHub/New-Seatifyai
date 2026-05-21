  import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { XCircle, Home, FileX } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function CancelPage() {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState(null);
  const [course, setCourse] = useState(null);
  const [program, setProgram] = useState(null);

  useEffect(() => {
    const loadApplication = async () => {
      if (application?.status === 'cancelled') {
        setCancelStatus('success');
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`/api/applications/${applicationId}`);
        const app = res.data;
        setApplication(app);

        if (app.status !== 'cancelled') {
          toast.error('This application is not in a cancelled state.');
          navigate(`/confirmation/${applicationId}`, { replace: true });
          return;
        }

        if (app.courseId) {
          try {
            const courseRes = await axios.get(`/api/courses/${app.courseId}`);
            setCourse(courseRes.data);
            const matchedProgram = courseRes.data.programs.find(p => p._id === app.programId);
            if (matchedProgram) setProgram(matchedProgram);
          } catch (courseErr) {
            console.warn('Could not load course details for cancelled application');
          }
        }
      } catch (err) {
        console.error('Error loading cancelled application:', err);
        toast.error('Could not load cancelled application details.');
        navigate('/admissions', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [applicationId, navigate]);

  const details = [
    ['Application ID', applicationId],
    ['Student Name', application?.fullName || user?.name || 'Student'],
    ['Institution', application?.collegeName || course?.collegeName || 'SNS Institutions'],
    ['Program', program?.name || application?.programName || 'N/A'],
    ['Course', course?.name || application?.courseName || 'N/A'],
    ['Amount Paid', `₹${(application?.fee || program?.fee || 0).toLocaleString('en-IN')}`],
    ['Refund Status', 'No Refund Applicable'],
  ];

  return (
    <div className="min-h-screen py-12 px-4 relative overflow-hidden flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-[0.03] blur-[120px]"
          style={{ background: 'radial-gradient(circle, #EF4444, transparent)' }} />
      </div>

      <div className="max-w-md w-full mx-auto relative z-10 animate-fade-up">
        {loading ? (
          <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 text-center">
            <div className="w-16 h-16 rounded-full border-4 border-red-100 border-t-red-500 animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900">Processing Cancellation...</h2>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="relative inline-block mb-6">
                <div className="w-28 h-28 rounded-full flex items-center justify-center mx-auto"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg bg-white">
                    <XCircle size={48} className="text-red-500" />
                  </div>
                </div>
              </div>
              <h1 className="text-4xl font-extrabold mb-3 text-gray-900" style={{ fontFamily: 'Clash Display' }}>
                Booking Cancelled
              </h1>
              <p className="text-gray-500 font-medium px-4">
                Your admission booking has been successfully cancelled.
              </p>
            </div>

            {/* Order Details Card */}
            <div className="bg-white rounded-[2rem] p-8 mb-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">
                  <FileX size={14} /> Order Details
                </h2>
                <div className="px-3 py-1 rounded-full bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider border border-red-100">
                  Cancelled
                </div>
              </div>
              
              <div className="space-y-4">
                {details.map(([label, val]) => (
                  <div key={label} className="flex justify-between items-start gap-4 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                    <span className="text-sm font-medium text-gray-400">{label}</span>
                    <span className={`text-sm font-bold text-right ${label === 'Refund Status' ? 'text-red-500' : 'text-gray-900'}`}>
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => navigate('/courses')}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base bg-gray-900 text-white shadow-xl hover:bg-black transition-all active:scale-95"
            >
              <Home size={18} /> Back to Courses
            </button>
          </>
        )}
      </div>
    </div>
  );
}
