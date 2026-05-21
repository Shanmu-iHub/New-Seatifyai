import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Download, User, Home, Sparkles } from 'lucide-react';
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
    setTimeout(() => setVisible(true), 100);
    
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/applications/${applicationId}`);
        setApplication(res.data);
        if (res.data.paymentId) setPaymentId(res.data.paymentId);
        
        const courseRes = await axios.get(`/api/courses/${res.data.courseId}`);
        setCourse(courseRes.data);
        const prog = courseRes.data.programs.find(p => p._id === res.data.programId);
        setProgram(prog);
      } catch (err) {
        console.error('Error fetching application details:', err);
      }
    };

    fetchData();

    // Automatically trigger download after 2 seconds
    const timer = setTimeout(() => {
      handleDownloadReceipt();
    }, 2000);

    return () => clearTimeout(timer);
  }, [applicationId]);

  useEffect(() => {
    if (!application) return;
    // 1 hour countdown timer
    const createdAt = application.createdAt ? new Date(application.createdAt) : new Date();
    const expiryTime = new Date(createdAt.getTime() + 60 * 60 * 1000);

    const interval = setInterval(() => {
      const now = new Date();
      const diff = expiryTime - now;

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
    ['Amount Paid', `₹${(application?.fee || program?.fee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
    ['Payment ID', paymentId || application?.paymentId || 'N/A'],
    ['Date & Time', `${dateStr} at ${timeStr}`],
    ['Status', 'Pre Registration Confirmed'],
  ];

  const handleDownloadReceipt = async () => {
    try {
      const doc = new jsPDF();
      const studentName = application?.fullName || user?.name || 'Student';
      
      // 1. Sidebar Accent (Yellow)
      doc.setFillColor(252, 211, 77); 
      const dateStr = application?.createdAt ? new Date(application.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = application?.createdAt ? new Date(application.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      // 1. Sidebar Accent (Yellow) - full custom page height
      doc.setFillColor(252, 211, 77);
      doc.rect(0, 0, 5, 340, 'F');

      // 2. Header Block (Black)
      doc.setFillColor(0, 0, 0);
      doc.rect(5, 10, 200, 35, 'F');
      
      // --- Logo Processing (Dynamic Aspect Ratio & PNG Conversion) ---
      const processLogo = (base64Str) => new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str.startsWith('data:') ? base64Str : 'data:image/webp;base64,' + base64Str;
        img.onload = () => {
          const cv = document.createElement('canvas');
          cv.width = img.naturalWidth;
          cv.height = img.naturalHeight;
          const ctx = cv.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve({
            data: cv.toDataURL('image/png'),
            width: img.naturalWidth,
            height: img.naturalHeight
          });
        };
        img.onerror = () => resolve(null);
      });

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
      doc.setFont("helvetica", "bold");
      doc.text("OFFICIAL RECEIPT", 135, 30);
      
      // 3. Info Section
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text(`ISSUED ON: `, 15, 55);
      doc.setFont("helvetica", "normal");
      doc.text(`${dateStr} at ${timeStr}`, 40, 55);
      
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
          fillColor: [0, 0, 0], 
          textColor: [255, 204, 0], 
          fontSize: 10, 
          fontStyle: 'bold' 
        },
        bodyStyles: { fontSize: 9, cellPadding: 5, textColor: [0, 0, 0] },
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
      
      // All content fits on one custom-height page (210x340mm)
      const y = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 160;

      // ── Helper: SVG string to high-res PNG Promise ──
      const makeSvgIcon = (svgStr) => new Promise((resolve) => {
        const img = new Image();
        img.src = 'data:image/svg+xml;base64,' + btoa(svgStr);
        img.onload = () => {
          const cv = document.createElement('canvas');
          cv.width = 512; cv.height = 512;
          const ctx = cv.getContext('2d');
          ctx.drawImage(img, 0, 0, 512, 512);
          resolve(cv.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null);
      });

      // A. Shield / Checkmark
      const iconCheck = await makeSvgIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01" stroke="#16a34a" stroke-width="3"></polyline></svg>`);
      
      // B. Calendar
      const iconCal = await makeSvgIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" fill="#ffffff"></rect><rect width="18" height="6" x="3" y="4" rx="2" ry="2" fill="#444444" stroke="none"></rect><circle cx="8" cy="14" r="1.5" fill="#444444" stroke="none"/><circle cx="12" cy="14" r="1.5" fill="#444444" stroke="none"/><circle cx="16" cy="14" r="1.5" fill="#444444" stroke="none"/><circle cx="8" cy="18" r="1.5" fill="#444444" stroke="none"/><circle cx="12" cy="18" r="1.5" fill="#444444" stroke="none"/><circle cx="21" cy="21" r="5" fill="#f59e0b" stroke="none"/><text x="21" y="23.5" fill="#ffffff" font-size="8" font-family="sans-serif" font-weight="bold" stroke="none" text-anchor="middle">!</text></svg>`);

      // C. Headset / Icons
      const iconMail = await makeSvgIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>`);
      const iconPhone = await makeSvgIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path></svg>`);
      const iconGlobe = await makeSvgIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" x2="22" y1="12" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`);

      // A. Verified Enrollment Block
      doc.setFillColor(245, 249, 246);
      doc.setDrawColor(230, 240, 230);
      doc.roundedRect(15, y + 10, 180, 22, 3, 3, 'FD');
      doc.addImage(iconCheck, 'PNG', 19, y + 12, 18, 18);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("VERIFIED ENROLLMENT", 42, y + 18);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text("This receipt confirms your seat reservation and initial fee payment in our system.", 42, y + 26);

      // B. Note Block
      doc.setFillColor(255, 248, 240);
      doc.setDrawColor(255, 235, 204);
      doc.roundedRect(15, y + 36, 180, 28, 3, 3, 'FD');
      doc.addImage(iconCal, 'PNG', 18, y + 38, 20, 20);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("NOTE:", 42, y + 45);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text("This is a temporary seat confirmation only. Students are required to visit the college campus", 42, y + 51);
      doc.text("directly to verify and confirm their course admission.", 42, y + 57);

      // C. Need Help Block
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("Need Help?", 17, y + 74);
      
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      
      doc.addImage(iconMail, 'PNG', 17, y + 78, 6, 5);
      doc.setTextColor(30, 30, 30);
      doc.text("support@seatifyai.com", 26, y + 82);
      
      doc.setTextColor(180, 180, 180);
      doc.text("|", 78, y + 82);
      
      doc.addImage(iconPhone, 'PNG', 82, y + 77.5, 5, 6);
      doc.setTextColor(30, 30, 30);
      doc.text("9600940618", 90, y + 82);
      
      doc.setTextColor(180, 180, 180);
      doc.text("|", 123, y + 82);
      
      doc.addImage(iconGlobe, 'PNG', 127, y + 77.5, 6, 6);
      doc.setTextColor(0, 102, 204);
      doc.text("www.seatifyai.com", 136, y + 82);

      // D. Tagline
      doc.setDrawColor(255, 180, 0);
      doc.setLineWidth(0.8);
      doc.line(82, y + 93, 99, y + 93);
      doc.line(111, y + 93, 128, y + 93);
      doc.setFillColor(255, 180, 0);
      doc.setDrawColor(255, 180, 0);
      doc.circle(105, y + 93, 1.5, 'FD');

      doc.setTextColor(0, 0, 120);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Take the first step today with Seatify", 105, y + 102, { align: 'center' });
      doc.text("towards a successful future.", 105, y + 109, { align: 'center' });

      // Footer
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.3);
      doc.line(15, y + 116, 195, y + 116);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "normal");
      const footerY = y + 123;
      doc.text("This is a digital receipt issued by SeatifyAI Admission System. www.seatifyai.com | Page 1 of 1", 105, footerY, { align: 'center' });
      
      doc.save(`Seatify_Receipt_${applicationId || 'Admission'}.pdf`);
      toast.success("Receipt generated!");
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("Download failed. Try again.");
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-[0.03] blur-[120px]"
          style={{ background: 'radial-gradient(circle, #10B981, transparent)' }} />
        <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full opacity-[0.03] blur-[120px]"
          style={{ background: 'radial-gradient(circle, #3B82F6, transparent)' }} />
      </div>

      <div className="max-w-md mx-auto relative z-10">

        {/* Animated check */}
        <div className={`text-center mb-8 transition-all duration-1000 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="relative inline-block mb-6">
            <div className="w-28 h-28 rounded-full flex items-center justify-center mx-auto"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: '#fff' }}>
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

        {/* Application Status Progress */}
        <div className={`bg-white rounded-[2rem] p-6 sm:p-8 mb-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 transition-all duration-1000 delay-150 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <h3 className="text-xl font-bold mb-8 text-gray-900">Application Status</h3>
          
          <div className="relative flex justify-between items-start w-full">
            {/* Connecting Line */}
            <div className="absolute top-[26px] left-[10%] right-[10%] h-[3px] bg-gray-200 z-0 rounded-full" />
            
            {/* Step 1: Applied (Active) */}
            <div className="relative z-10 flex flex-col items-center w-1/4">
              <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center border-[6px] border-amber-100 shadow-sm mb-2 relative">
                {/* Glowing ring */}
                <div className="absolute inset-[-6px] rounded-full border border-amber-200 animate-ping opacity-20"></div>
                <span className="text-2xl">📝</span>
              </div>
              <p className="text-sm font-bold text-gray-900 whitespace-nowrap">Applied</p>
              <p className="text-[10px] font-bold text-amber-500 mt-0.5 text-center leading-tight">Application<br className="sm:hidden" /> submitted</p>
            </div>

            {/* Step 2: Docs Review */}
            <div className="relative z-10 flex flex-col items-center w-1/4 pt-1">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white mb-3">
                <span className="text-xl">📋</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-400 whitespace-nowrap">Docs Review</p>
            </div>

            {/* Step 3: Campus Visit */}
            <div className="relative z-10 flex flex-col items-center w-1/4 pt-1">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white mb-3">
                <span className="text-xl">🏫</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-400 whitespace-nowrap">Campus Visit</p>
            </div>

            {/* Step 4: Confirmed */}
            <div className="relative z-10 flex flex-col items-center w-1/4 pt-1">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white mb-3">
                <span className="text-xl">✅</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-400 whitespace-nowrap">Confirmed</p>
            </div>
          </div>
        </div>

        {/* Details card */}
        <div className={`bg-white rounded-[2rem] p-8 mb-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 transition-all duration-1000 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
              Admission Receipt
            </h2>
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
              application?.paymentStatus === 'completed'
                ? 'bg-green-50 text-green-600 border-green-100'
                : application?.paymentStatus === 'pay_later'
                ? 'bg-yellow-50 text-yellow-600 border-yellow-100'
                : 'bg-blue-50 text-blue-600 border-blue-100'
            }`}>
              {application?.paymentStatus === 'completed' ? 'Paid' : application?.paymentStatus === 'pay_later' ? 'Pay Later' : 'Pending'}
            </div>
          </div>
          
          <div className="space-y-4">
            {details.map(([label, val]) => (
              <div key={label} className="flex justify-between items-start gap-4 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                <span className="text-sm font-medium text-gray-400">{label}</span>
                <span className={`text-sm font-bold text-right ${label === 'Status' ? 'text-green-500' : 'text-gray-900'} ${label === 'Application ID' ? 'font-mono text-blue-600' : ''}`}>
                  {val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
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

        {/* Note */}
        {/* Policy Note (UI) */}
        <div className="mt-8 p-4 rounded-2xl bg-yellow-50 border border-yellow-100">
          <p className="text-[11px] leading-relaxed text-yellow-800 text-center font-medium">
            <span className="font-black flex items-center justify-center gap-1 mb-1">⚠️ Important</span>
            This booking is temporary. You must visit the campus with all original documents for physical verification and final confirmation of admission. Failure to do so may result in automatic cancellation.
          </p>
        </div>

        {/* New Action Buttons */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 transition-all duration-1000 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          {application?.paymentStatus !== 'completed' && (
            <button
              onClick={() => navigate(`/payment/${application.applicationId}`, { state: { application, course, program } })}
              className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-green-500 text-white hover:bg-green-600 transition-all shadow-md"
            >
              💳 Pay Now
            </button>
          )}
          <button
            onClick={() => {
              if (!canEdit) return toast.error('Edit time has expired.');
              if (application?.isEdited) return toast.error('You have already edited your details once.');
              navigate(`/apply/${application.courseId}?editId=${application.applicationId}`);
            }}
            disabled={!canEdit || application?.isEdited}
            className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm border transition-all shadow-sm ${(canEdit && !application?.isEdited) ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50' : 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed'}`}
          >
            ✏️ Edit Details {(canEdit && !application?.isEdited) && editTimeLeft ? `(${editTimeLeft})` : (application?.isEdited ? '(Already Edited)' : '')}
          </button>
          <button
            onClick={() => setShowCancelPopup(true)}
            className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-red-50 text-red-500 hover:bg-red-100 transition-all"
          >
            Cancel Booking (No Refund)
          </button>
        </div>

        {/* Support link */}
        <p className="text-center text-xs mt-8 text-gray-400 font-medium">
          Need help? Contact support at <span className="text-blue-600 font-bold">+91 9600940618</span>
        </p>
      </div>

      {/* Cancel Warning Popup */}
      {showCancelPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
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
                onClick={() => navigate(`/cancel-booking/${applicationId}`, { state: { application, course, program, paymentId } })}
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
