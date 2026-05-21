import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Download, Home, Sparkles, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import { logoBase64 } from '../assets/logoBase64';

export default function ConfirmationPage() {
  const { applicationId } = useParams();
  const { user } = useAuth();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [editTimeLeft, setEditTimeLeft] = useState('');
  const [canEdit, setCanEdit] = useState(true);
  const [applicationReady, setApplicationReady] = useState(false);
  const [fullPaymentId, setFullPaymentId] = useState(state?.paymentId || state?.application?.paymentId || null);
  const [showFullPaymentId, setShowFullPaymentId] = useState(false);
  const [loadingFullPaymentId, setLoadingFullPaymentId] = useState(false);
  const [application, setApplication] = useState(state?.application || null);
  const [course, setCourse] = useState(state?.course || null);
  const [program, setProgram] = useState(state?.program || null);
  const [paymentId, setPaymentId] = useState(state?.paymentId || state?.application?.paymentId || null);

  useEffect(() => {
    if (state?.application) {
      setApplication(state.application);
      if (state.application.paymentId) setPaymentId(state.application.paymentId);
    }
    if (state?.course) setCourse(state.course);
    if (state?.program) setProgram(state.program);
  }, [state]);

  useEffect(() => {
    const visibleTimer = setTimeout(() => setVisible(true), 100);

    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/applications/${applicationId}`);
        const app = res.data;

        if (app.status === 'cancelled') {
          navigate(`/cancel-booking/${applicationId}`, { replace: true });
          return;
        }

        if (app.paymentStatus !== 'completed' && app.status !== 'confirmed') {
          navigate(`/payment/${applicationId}`, { replace: true });
          return;
        }

        setApplication(app);
        if (app.paymentId) setPaymentId(app.paymentId);

        if (app.courseId) {
          const courseRes = await axios.get(`/api/courses/${app.courseId}`);
          setCourse(courseRes.data);
          const matchedProgram = courseRes.data.programs.find(p => p._id === app.programId);
          if (matchedProgram) setProgram(matchedProgram);
        }
      } catch (err) {
        console.error('Error fetching application details:', err);
        toast.error('Could not load confirmation details.');
        navigate('/admissions', { replace: true });
      } finally {
        setApplicationReady(true);
      }
    };

    fetchData();

    return () => clearTimeout(visibleTimer);
  }, [applicationId, navigate]);

  useEffect(() => {
    if (!applicationReady || !application) return undefined;

    const timer = setTimeout(() => {
      handleDownloadReceipt();
    }, 2000);

    return () => clearTimeout(timer);
  }, [applicationReady, application]);

  useEffect(() => {
    if (!application) return;

    const createdAt = application.createdAt ? new Date(application.createdAt) : new Date();
    const expiryTime = new Date(createdAt.getTime() + 60 * 60 * 1000);

    const interval = setInterval(() => {
      const diff = expiryTime - new Date();

      if (diff <= 0) {
        setEditTimeLeft('Expired');
        setCanEdit(false);
        clearInterval(interval);
      } else {
        const m = Math.floor(diff / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setEditTimeLeft(`${m}m ${s}s left`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [application]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

  const details = [
    ['Institution Name', application?.collegeName || course?.collegeName || 'SNS Institutions'],
    ['Application ID', applicationId],
    ['Student Name', application?.fullName || user?.name || 'Student'],
    ['Program', program?.name || application?.programName || 'N/A'],
    ['Course', course?.name || application?.courseName || 'N/A'],
    ['Amount Paid', `INR ${(application?.fee || program?.fee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
    ['Payment ID', paymentId || application?.paymentId || 'N/A'],
    ['Date & Time', `${dateStr} at ${timeStr}`],
    ['Status', 'Pre Registration Confirmed'],
  ];

  const canEditApplication = Boolean(
    application &&
    application.status !== 'cancelled' &&
    application.paymentStatus !== 'completed' &&
    application.status !== 'confirmed' &&
    canEdit &&
    !application.isEdited
  );
  const canCancelApplication = Boolean(
    application &&
    application.status !== 'cancelled' &&
    application.paymentStatus !== 'completed' &&
    application.status !== 'confirmed'
  );

  const handleTogglePaymentId = async () => {
    if (showFullPaymentId) {
      setShowFullPaymentId(false);
      return;
    }

    if (fullPaymentId && fullPaymentId === (paymentId || application?.paymentId || null) && String(fullPaymentId).includes('*')) {
      setFullPaymentId(null);
    }

    if (!fullPaymentId) {
      try {
        setLoadingFullPaymentId(true);
        const res = await axios.get(`/api/applications/${applicationId}/payment-reference`);
        setFullPaymentId(res.data.paymentId || null);
      } catch (err) {
        toast.error('Could not load the full payment ID');
        return;
      } finally {
        setLoadingFullPaymentId(false);
      }
    }

    setShowFullPaymentId(true);
  };

  const handleDownloadReceipt = async () => {
    try {
      const doc = new jsPDF();
      const studentName = application?.fullName || user?.name || 'Student';

      doc.setFillColor(252, 211, 77);
      const dateStr = application?.createdAt ? new Date(application.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = application?.createdAt ? new Date(application.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      // 1. Sidebar Accent (Yellow) - full custom page height
      doc.setFillColor(252, 211, 77);
      doc.rect(0, 0, 5, 340, 'F');

      doc.setFillColor(0, 0, 0);
      doc.rect(5, 10, 200, 35, 'F');

      if (logoBase64) {
        const logo = await processLogo(logoBase64);
        if (logo) {
          const targetHeight = 18; // Desired height in mm
          const aspect = logo.width / logo.height;
          const targetWidth = targetHeight * aspect;
          doc.addImage(logo.data, 'PNG', 15, 18, targetWidth, targetHeight);
        }
      }

      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL RECEIPT', 135, 30);

      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text(`ISSUED ON: ${dateStr || 'N/A'} at ${timeStr || 'N/A'}`, 15, 55);

      doc.setFont('helvetica', 'bold');
      doc.text('APPLICATION ID:', 115, 55);
      doc.setFont('helvetica', 'normal');
      doc.text(`${applicationId || 'N/A'}`, 145, 55);

      const tableData = [
        ['INSTITUTION NAME', (application?.collegeName || course?.collegeName || 'SNS Institutions').toUpperCase()],
        ['APPLICATION ID', applicationId || 'N/A'],
        ['STUDENT NAME', studentName.toUpperCase()],
        ['PROGRAM', (program?.name || application?.programName || 'N/A').toUpperCase()],
        ['COURSE', (course?.name || application?.courseName || 'N/A').toUpperCase()],
        ['AMOUNT PAID', `INR ${(application?.fee || program?.fee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ['PAYMENT ID', paymentId || application?.paymentId || 'N/A'],
        ['DATE & TIME', `${dateStr} at ${timeStr}`],
        ['STATUS', 'PRE REGISTRATION CONFIRMED']
      ];

      autoTable(doc, {
        startY: 65,
        head: [['DESCRIPTION', 'DETAILS']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [31, 41, 55],
          textColor: [252, 211, 77],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'left'
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 5,
          textColor: [31, 41, 55]
        },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: 'bold', fillColor: [250, 250, 250] }
        },
        didParseCell: function (data) {
          if (data.section === 'body' && data.column.index === 1 && data.row.index === 8) {
             data.cell.styles.textColor = [0, 153, 51]; // Green status
             data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 180;

      doc.setFillColor(245, 245, 245);
      doc.rect(15, finalY + 10, 180, 25, 'F');

      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'bold');
      doc.text('VERIFIED ENROLLMENT', 20, finalY + 25);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('This receipt confirms that your seat reservation and initial fee payment have been recorded in our system.', 65, finalY + 25);

      doc.setFillColor(254, 252, 232);
      doc.setDrawColor(252, 211, 77);
      doc.rect(15, finalY + 45, 180, 25, 'FD');

      doc.setFontSize(9);
      doc.setTextColor(31, 41, 55);
      doc.setFont('helvetica', 'bold');
      doc.text('NOTE:', 20, finalY + 58);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const noteText = 'This is a temporary seat confirmation only. Students are required to visit the college campus directly to verify and confirm their course admission.';
      const splitNote = doc.splitTextToSize(noteText, 145);
      doc.text(splitNote, 38, finalY + 58);

      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      const footerY = Math.max(280, finalY + 80);
      doc.text('This is a digital receipt issued by SeatifyAI Admission System.  www.seatifyai.com  |  Page 1 of 1', 105, footerY, { align: 'center' });

      doc.save(`Seatify_Receipt_${applicationId || 'Admission'}.pdf`);
      toast.success('Receipt generated!');
    } catch (err) {
      console.error('PDF Error:', err);
      toast.error('Download failed. Try again.');
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-[0.03] blur-[120px]" style={{ background: 'radial-gradient(circle, #10B981, transparent)' }} />
        <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full opacity-[0.03] blur-[120px]" style={{ background: 'radial-gradient(circle, #3B82F6, transparent)' }} />
      </div>

      <div className="max-w-md mx-auto relative z-10">
        <div className={`text-center mb-8 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="relative inline-block mb-6">
            <div className="w-28 h-28 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg" style={{ background: '#fff' }}>
                <CheckCircle size={48} className="text-green-500" />
              </div>
            </div>
            <div className="absolute -right-2 top-0">
              <div className="bg-blue-500 text-white p-2 rounded-full shadow-lg animate-bounce">
                <Sparkles size={16} />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold mb-3 text-gray-900" style={{ fontFamily: 'Clash Display' }}>
            Success!
          </h1>
          <p className="text-gray-500 font-medium px-4">
            Your admission for <span className="text-gray-900 font-bold">{course?.name || application?.courseName || 'the program'}</span> at <span className="text-gray-900 font-bold">{application?.collegeName || course?.collegeName || 'SNS Institutions'}</span> has been successfully registered.
          </p>
        </div>

        <div className={`bg-white rounded-[2rem] p-6 sm:p-8 mb-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 transition-all duration-1000 delay-150 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <h3 className="text-xl font-bold mb-8 text-gray-900">Application Status</h3>

          <div className="relative flex justify-between items-start w-full">
            <div className="absolute top-[26px] left-[10%] right-[10%] h-[3px] bg-gray-200 z-0 rounded-full" />

            <div className="relative z-10 flex flex-col items-center w-1/4">
              <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center border-[6px] border-amber-100 shadow-sm mb-2 relative">
                <div className="absolute inset-[-6px] rounded-full border border-amber-200 animate-ping opacity-20"></div>
                <span className="text-2xl">Applied</span>
              </div>
              <p className="text-sm font-bold text-gray-900 whitespace-nowrap">Applied</p>
              <p className="text-[10px] font-bold text-amber-500 mt-0.5 text-center leading-tight">Application submitted</p>
            </div>

            <div className="relative z-10 flex flex-col items-center w-1/4 pt-1">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white mb-3">
                <span className="text-xl">Review</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-400 whitespace-nowrap">Docs Review</p>
            </div>

            <div className="relative z-10 flex flex-col items-center w-1/4 pt-1">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white mb-3">
                <span className="text-xl">Visit</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-400 whitespace-nowrap">Campus Visit</p>
            </div>

            <div className="relative z-10 flex flex-col items-center w-1/4 pt-1">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white mb-3">
                <span className="text-xl">Done</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-400 whitespace-nowrap">Confirmed</p>
            </div>
          </div>
        </div>

        <div className={`bg-white rounded-[2rem] p-8 mb-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 transition-all duration-1000 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Admission Receipt</h2>
            <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border bg-green-50 text-green-600 border-green-100">
              Paid
            </div>
          </div>

          <div className="space-y-4">
            {details.map(([label, val]) => (
              <div key={label} className="flex justify-between items-start gap-4 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                <span className="text-sm font-medium text-gray-400">{label}</span>
                <div className="flex items-center justify-end gap-2 text-right">
                  <span className={`text-sm font-bold ${label === 'Status' ? 'text-green-500' : 'text-gray-900'} ${label === 'Application ID' ? 'font-mono text-blue-600' : ''}`}>
                    {label === 'Payment ID' && showFullPaymentId && fullPaymentId ? fullPaymentId : val}
                  </span>
                  {label === 'Payment ID' && val !== 'N/A' && (
                    <button
                      type="button"
                      onClick={handleTogglePaymentId}
                      disabled={loadingFullPaymentId}
                      className="w-8 h-8 rounded-full border border-gray-100 bg-gray-50 text-gray-500 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all flex items-center justify-center"
                      title={showFullPaymentId ? 'Hide payment ID' : 'View payment ID'}
                    >
                      {showFullPaymentId ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`flex flex-col gap-3 transition-all duration-1000 delay-400 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/courses')}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm bg-white border border-gray-100 text-gray-600 hover:bg-gray-50 transition-all"
            >
              <Home size={16} /> Home
            </button>
            <button
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm bg-gray-900 text-white hover:bg-black transition-all"
              onClick={handleDownloadReceipt}
            >
              <Download size={16} /> Receipt
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-2xl bg-yellow-50 border border-yellow-100">
          <p className="text-[11px] leading-relaxed text-yellow-800 text-center font-medium">
            <span className="font-black flex items-center justify-center gap-1 mb-1">Important</span>
            This booking is temporary. You must visit the campus with all original documents for physical verification and final confirmation of admission. Failure to do so may result in automatic cancellation.
          </p>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 transition-all duration-1000 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <button
            onClick={() => {
              if (!canEditApplication) return toast.error('Editing is no longer allowed for this application.');
              navigate(`/apply/${application.courseId}?editId=${application.applicationId}`);
            }}
            disabled={!canEditApplication}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm border transition-all shadow-sm ${canEditApplication ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50' : 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            Edit Details {canEditApplication && editTimeLeft ? `(${editTimeLeft})` : (application?.isEdited ? '(Already Edited)' : '')}
          </button>
          <button
            onClick={() => setShowCancelPopup(true)}
            disabled={!canCancelApplication}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm transition-all ${canCancelApplication ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-gray-50 text-gray-400 cursor-not-allowed'}`}
          >
            Cancel Booking (No Refund)
          </button>
        </div>

        <p className="text-center text-xs mt-8 text-gray-400 font-medium">
          Need help? Contact support at <span className="text-blue-600 font-bold">+91 9600940618</span>
        </p>
      </div>

      {showCancelPopup && canCancelApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">!</span>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Cancel Booking?</h3>
            <p className="text-center text-gray-500 text-sm mb-6">
              Are you sure you want to cancel your booking? Please note that this action is permanent and there will be <span className="font-bold text-red-500">NO REFUND</span> for the amount paid.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelPopup(false)}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                No, Keep it
              </button>
              <button
                onClick={async () => {
                  try {
                    await axios.post(`/api/applications/${applicationId}/cancel`);
                    toast.success('Application cancelled.');
                    navigate(`/cancel-booking/${applicationId}`, { replace: true });
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Failed to cancel application.');
                    setShowCancelPopup(false);
                  }
                }}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 transition-all shadow-lg shadow-red-200"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
