import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Download, User, Home, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
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

  const application = state?.application;
  const course = state?.course;
  const program = state?.program;
  const paymentId = state?.paymentId;

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    
    // Automatically trigger download after 2 seconds
    const timer = setTimeout(() => {
      handleDownloadReceipt();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

  const details = [
    ['Institution Name', application?.collegeName || course?.collegeName || 'SNS Institutions'],
    ['Application ID', applicationId],
    ['Student Name', application?.fullName || user?.name || 'Student'],
    ['Program', program?.name || 'N/A'],
    ['Course', course?.name || 'N/A'],
    ['Amount Paid', `₹${((program?.fee || 0) + 1).toLocaleString('en-IN')}`],
    ['Payment ID', paymentId || 'N/A'],
    ['Date & Time', `${dateStr} at ${timeStr}`],
    ['Status', 'Pre Registration Confirmed'],
  ];

  const handleDownloadReceipt = async () => {
    try {
      const doc = new jsPDF();
      const studentName = application?.fullName || user?.name || 'Student';
      
      // 1. Sidebar Accent (Yellow)
      doc.setFillColor(252, 211, 77); 
      doc.rect(0, 0, 5, 297, 'F');

      // 2. Header Block (Black)
      doc.setFillColor(0, 0, 0); 
      doc.rect(5, 10, 200, 35, 'F');
      
      // --- Logo Only (White Version) ---
      if (logoBase64) {
        doc.addImage(logoBase64, 'WEBP', 15, 16, 46, 23);
      }
      
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("OFFICIAL RECEIPT", 135, 30);
      
      // 3. Info Section
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99); 
      doc.text(`ISSUED ON: ${dateStr || 'N/A'} at ${timeStr || 'N/A'}`, 15, 55);
      
      // Fixed Application ID Alignment (Moved left to prevent cut-off)
      doc.setFont("helvetica", "bold");
      doc.text("APPLICATION ID:", 115, 55);
      doc.setFont("helvetica", "normal");
      doc.text(`${applicationId || 'N/A'}`, 145, 55);
      
      // 4. Data Table (RE-ORDERED AS REQUESTED)
      const tableData = [
        ['INSTITUTION NAME', (application?.collegeName || course?.collegeName || 'SNS Institutions').toUpperCase()],
        ['APPLICATION ID', applicationId || 'N/A'],
        ['STUDENT NAME', studentName.toUpperCase()],
        ['PROGRAM', (program?.name || 'N/A').toUpperCase()],
        ['COURSE', (course?.name || 'N/A').toUpperCase()],
        ['AMOUNT PAID', `INR ${((program?.fee || 0) + 1).toLocaleString('en-IN')}`],
        ['PAYMENT ID', paymentId || 'N/A'],
        ['DATE & TIME', `${dateStr || 'N/A'} at ${timeStr || 'N/A'}`],
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
          0: { cellWidth: 55, fontStyle: 'bold', fillColor: [249, 250, 251] },
          1: { cellWidth: 'auto' }
        },
        styles: {
          lineColor: [229, 231, 235],
          lineWidth: 0.1
        }
      });
      
      const finalY = (doc.lastAutoTable && doc.lastAutoTable.finalY) || 180;
      
      // 5. Verification Badge (FIXED OVERLAP)
      doc.setFillColor(245, 245, 245);
      doc.rect(15, finalY + 10, 180, 25, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(31, 41, 55);
      doc.setFont("helvetica", "bold");
      doc.text("VERIFIED ENROLLMENT", 20, finalY + 25);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text("This receipt confirms your seat reservation and initial fee payment in our system.", 65, finalY + 25);

      // 6. Policy Note (FIXED SPACING)
      doc.setFillColor(254, 252, 232); // Light yellow
      doc.setDrawColor(252, 211, 77); // Yellow border
      doc.rect(15, finalY + 45, 180, 25, 'FD');
      
      doc.setFontSize(9);
      doc.setTextColor(31, 41, 55);
      doc.setFont("helvetica", "bold");
      doc.text("NOTE:", 20, finalY + 58);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const noteText = "This is a temporary seat confirmation only. Students are required to visit the college campus directly to verify and confirm their course admission.";
      const splitNote = doc.splitTextToSize(noteText, 145);
      doc.text(splitNote, 38, finalY + 58);

      // 7. Footer (One Line)
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      const footerY = Math.max(280, finalY + 80);
      doc.text("This is a digital receipt issued by SeatifyAI Admission System.  www.seatifyai.com  |  Page 1 of 1", 105, footerY, { align: 'center' });
      
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
            Your admission for <span className="text-gray-900 font-bold">{program?.name || 'the program'}</span> at <span className="text-gray-900 font-bold">{application?.collegeName || course?.collegeName || 'SNS Institutions'}</span> has been successfully registered.
          </p>
        </div>

        {/* Details card */}
        <div className={`bg-white rounded-[2rem] p-8 mb-6 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 transition-all duration-1000 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">
              Admission Receipt
            </h2>
            <div className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider border border-green-100">
              Paid
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
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base shadow-xl shadow-blue-100 transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', color: '#fff' }}>
            <User size={18} /> My Dashboard
          </button>
          
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
            <span className="font-black">NOTE:</span> This is a temporary seat confirmation only. Students are required to visit the college campus directly to verify and confirm their course admission.
          </p>
        </div>

        {/* Support link */}
        <p className="text-center text-xs mt-8 text-gray-400 font-medium">
          Need help? Contact support at <span className="text-blue-600 font-bold">+91 9600940618</span>
        </p>
      </div>
    </div>
  );
}
