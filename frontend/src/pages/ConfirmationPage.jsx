import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Download, User, Home, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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

  const handleDownloadReceipt = async () => {
    try {
      const doc = new jsPDF();
      const logoUrl = "http://k12.seatifyai.com/wp-content/uploads/2025/04/Logo-Seatifyai-scaled.webp";
      
      // Helper to load image as base64
      const getBase64Image = (url) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.setAttribute('crossOrigin', 'anonymous');
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL("image/png");
            resolve(dataURL);
          };
          img.onerror = (error) => reject(error);
          img.src = url;
        });
      };

      let base64Logo = null;
      try {
        base64Logo = await getBase64Image(logoUrl);
      } catch (e) {
        console.error("Logo load failed", e);
      }

      // Header
      if (base64Logo) {
        doc.addImage(base64Logo, 'PNG', 15, 10, 40, 15);
      }
      
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Admission Receipt", 120, 22);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(15, 35, 195, 35);
      
      // Details
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Date: ${dateStr}`, 15, 45);
      doc.text(`Time: ${timeStr}`, 15, 52);
      
      doc.autoTable({
        startY: 65,
        head: [['Description', 'Details']],
        body: details.map(([label, val]) => [label, val]),
        theme: 'striped',
        headStyles: { fillStyle: '#3B82F6', textColor: '#FFFFFF' },
        styles: { fontSize: 10, cellPadding: 5 }
      });
      
      const finalY = doc.lastAutoTable.finalY || 150;
      
      // Footer
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("This is a computer-generated receipt and does not require a signature.", 15, finalY + 20);
      doc.setTextColor(59, 130, 246);
      doc.text("www.seatifyai.com", 15, finalY + 30);
      
      doc.save(`Seatify_Receipt_${applicationId}.pdf`);
      toast.success("Receipt downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF. Please try again.");
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
            Your admission for <span className="text-gray-900 font-bold">{program?.name || 'the program'}</span> has been successfully registered.
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
        <p className="text-center text-xs mt-10 text-gray-400 font-medium">
          Need help? Contact support at <span className="text-blue-600 font-bold">help@seatifyai.com</span>
        </p>
      </div>
    </div>
  );
}
