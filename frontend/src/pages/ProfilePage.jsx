import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { User, BookOpen, CreditCard, FileText, CheckCircle, Clock, AlertCircle, Edit, X, Save, Download, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { logoBase64 } from '../assets/logoBase64';

// Static tabs are replaced by dynamic tabs inside the component

const getDocumentRequirements = (courseName, category) => {
  if (!courseName) return [];
  const docs = [
    { id: 'aadhar', label: 'Aadhar Card *' },
    { id: 'birthCertificate', label: 'Birth Certificate' },
    { id: 'community', label: 'Community Certificate' },
  ];
  
  const name = courseName.toLowerCase();
  
  if (category === 'K-12') {
    if (name.includes('grade 11') || name.includes('grade 12')) {
      docs.push({ id: 'marksheet10', label: '10th Mark Sheet' });
      docs.push({ id: 'previousSchoolTC', label: 'Transfer Certificate (TC)' });
    } else if (!name.includes('pre kg')) {
      docs.push({ id: 'previousSchoolTC', label: 'Transfer Certificate (TC)' });
    }
  } else {
    docs.push({ id: 'marksheet10', label: '10th Mark Sheet' });
    docs.push({ id: 'marksheet12', label: '12th Mark Sheet / Diploma Certificate' });
  }
  docs.push({ id: 'admissionForm', label: 'Admission Form' });
  
  return docs;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview');
  const [profile, setProfile] = useState(null);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeDocSubTab, setActiveDocSubTab] = useState('Pending Documents');
  const [uploadProgress, setUploadProgress] = useState({}); // { [docId]: percent }
  const [confirmDelete, setConfirmDelete] = useState(null); // { applicationId, docKey, label }
  const [confirmCancel, setConfirmCancel] = useState(null); // adm object
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [editForm, setEditForm] = useState({
    fullName: '',
    mobile: '',
    dob: '',
    community: '',
    parentName: '',
    parentOccupation: '',
    parentMobile: '',
    homeTown: '',
    district: '',
    districtOther: '',
    currentQualification: '',
    aadhar: '',
    email: ''
  });

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

  useEffect(() => {
    if (!isEditing || !profile) return;

    // Check if form values actually changed from current profile values
    const hasChanged = 
      editForm.fullName !== (profile.fullName || '') ||
      editForm.mobile !== (profile.mobile || '') ||
      editForm.dob !== (profile.dob || '') ||
      editForm.community !== (profile.community || '') ||
      editForm.parentName !== (profile.parentName || '') ||
      editForm.parentOccupation !== (profile.parentOccupation || '') ||
      editForm.parentMobile !== (profile.parentMobile || '') ||
      editForm.homeTown !== (profile.homeTown || '') ||
      editForm.district !== (profile.district || '') ||
      editForm.districtOther !== (profile.districtOther || '') ||
      editForm.currentQualification !== (profile.currentQualification || '') ||
      editForm.aadhar !== (profile.aadhar || '') ||
      editForm.email !== (profile.email || '');

    if (!hasChanged) {
      setSaveStatus('saved');
      return;
    }

    if (!editForm.fullName || !editForm.email || !editForm.mobile || !editForm.dob) {
      setSaveStatus('error');
      return;
    }

    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(editForm.mobile)) {
      toast.error('Student contact number must be exactly 10 digits');
      setSaveStatus('error');
      return;
    }
    if (editForm.parentMobile && !mobileRegex.test(editForm.parentMobile)) {
      toast.error('Parent contact number must be exactly 10 digits');
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');

    const delayDebounce = setTimeout(async () => {
      try {
        await axios.put('/api/students/profile', {
          name: editForm.fullName,
          email: editForm.email,
          mobile: editForm.mobile,
          dob: editForm.dob,
          fullName: editForm.fullName,
          community: editForm.community,
          parentName: editForm.parentName,
          parentOccupation: editForm.parentOccupation,
          parentMobile: editForm.parentMobile,
          homeTown: editForm.homeTown,
          district: editForm.district,
          districtOther: editForm.districtOther,
          currentQualification: editForm.currentQualification,
          aadhar: editForm.aadhar
        });
        setSaveStatus('saved');
        
        // Fetch profile silently to sync the student card info without flashing or taking focus away
        const res = await axios.get('/api/students/profile');
        setProfile(res.data.profile);
        setAdmissions(res.data.admissions || []);
      } catch (err) {
        console.error(err);
        setSaveStatus('error');
      }
    }, 1000); // 1-second debounce

    return () => clearTimeout(delayDebounce);
  }, [editForm, isEditing]);

  const confirmedAdmissions = admissions.filter(adm => adm.status === 'confirmed');
  
  let hasPendingDocs = false;
  confirmedAdmissions.forEach(adm => {
    const requiredDocs = getDocumentRequirements(adm.courseName, adm.category);
    const uploadedDocs = adm.docs || {};
    const missingDocs = requiredDocs.filter(d => !uploadedDocs[d.id]);
    if (missingDocs.length > 0) {
      hasPendingDocs = true;
    }
  });

  const tabsList = ['Overview', 'Admissions'];
  if (confirmedAdmissions.length > 0) {
    tabsList.push('Documents');
  }

  // Set default document sub tab based on pending status
  useEffect(() => {
    if (confirmedAdmissions.length > 0) {
      if (hasPendingDocs) {
        setActiveDocSubTab('Pending Documents');
      } else {
        setActiveDocSubTab('Uploaded Documents');
      }
    } else {
      if (activeTab === 'Documents') {
        setActiveTab('Overview');
      }
    }
  }, [admissions, hasPendingDocs]);
  const handleCancelAdmission = async () => {
    if (!confirmCancel) return;
    const adm = confirmCancel;
    
    setLoading(true);
    setConfirmCancel(null);
    try {
      await axios.post(`/api/applications/${adm.applicationId}/cancel`);
      toast.success("Admission cancelled successfully. You can now book another course.");
      fetchProfile();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to cancel admission");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPendingDoc = async (applicationId, docId, file) => {
    if (!file) return;
    setUploadProgress(prev => ({ ...prev, [docId]: 0 }));
    try {
      const fd = new FormData();
      fd.append(`doc_${docId}`, file);
      await axios.post(`/api/applications/${applicationId}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(prev => ({ ...prev, [docId]: percent }));
        }
      });
      toast.success('Document uploaded successfully!');
      await fetchProfile();
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload document');
    } finally {
      setUploadProgress(prev => {
        const next = { ...prev };
        delete next[docId];
        return next;
      });
    }
  };

  const handleRemoveDoc = async (applicationId, docKey) => {
    setLoading(true);
    try {
      await axios.delete(`/api/applications/${applicationId}/documents/${docKey}`);
      toast.success("Document removed successfully.");
      fetchProfile();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to remove document");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async (adm) => {
    const toastId = toast.loading("Generating receipt...");
    try {
      const doc = new jsPDF({ format: [210, 340] });
      const studentName = profile?.fullName || user?.name || 'Student';
      const dateStr = new Date(adm.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
      const timeStr = new Date(adm.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

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
        ['INSTITUTION NAME', adm.collegeName || 'SNS Institutions'],
        ['APPLICATION ID', adm.applicationId],
        ['STUDENT NAME', studentName.toUpperCase()],
        ['PROGRAM', (adm.programName || 'N/A').toUpperCase()],
        ['COURSE', (adm.courseName || 'N/A').toUpperCase()],
        ['AMOUNT PAID', `INR ${((adm.fee || 0)).toLocaleString('en-IN')}`],
        ['PAYMENT ID', adm.paymentId || 'N/A'],
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

      // A. Shield / Checkmark (Lucide: CheckCircle modified)
      const iconCheck = await makeSvgIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01" stroke="#16a34a" stroke-width="3"></polyline></svg>`);
      
      // B. Calendar (Lucide: Calendar modified)
      const iconCal = await makeSvgIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" fill="#ffffff"></rect><rect width="18" height="6" x="3" y="4" rx="2" ry="2" fill="#444444" stroke="none"></rect><circle cx="8" cy="14" r="1.5" fill="#444444" stroke="none"/><circle cx="12" cy="14" r="1.5" fill="#444444" stroke="none"/><circle cx="16" cy="14" r="1.5" fill="#444444" stroke="none"/><circle cx="8" cy="18" r="1.5" fill="#444444" stroke="none"/><circle cx="12" cy="18" r="1.5" fill="#444444" stroke="none"/><circle cx="21" cy="21" r="5" fill="#f59e0b" stroke="none"/><text x="21" y="23.5" fill="#ffffff" font-size="8" font-family="sans-serif" font-weight="bold" stroke="none" text-anchor="middle">!</text></svg>`);

      // C. Headset (Lucide: Headphones modified)
      const iconHead = await makeSvgIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="11" stroke="#222" stroke-width="1.5"/><path d="M5 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a9 9 0 0 1 14 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" stroke="#222" stroke-width="2"/><circle cx="18" cy="19" r="2.5" fill="#f59e0b" stroke="none"/></svg>`);

      // D. Envelope (Lucide: Mail)
      const iconMail = await makeSvgIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>`);

      // E. Phone (Lucide: Smartphone)
      const iconPhone = await makeSvgIcon(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path></svg>`);

      // F. Globe (Lucide: Globe)
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
      // Headset icon removed as requested.
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("Need Help?", 17, y + 74);
      
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      
      // Email with canvas icon
      doc.addImage(iconMail, 'PNG', 17, y + 78, 6, 5);
      doc.setTextColor(30, 30, 30);
      doc.text("support@seatifyai.com", 26, y + 82);
      
      doc.setTextColor(180, 180, 180);
      doc.text("|", 78, y + 82);
      
      // Phone with canvas icon
      doc.addImage(iconPhone, 'PNG', 82, y + 77.5, 5, 6);
      doc.setTextColor(30, 30, 30);
      doc.text("9600940618", 90, y + 82);
      
      doc.setTextColor(180, 180, 180);
      doc.text("|", 123, y + 82);
      
      // Globe with canvas icon
      doc.addImage(iconGlobe, 'PNG', 127, y + 77.5, 6, 6);
      doc.setTextColor(0, 102, 204);
      doc.text("www.seatifyai.com", 136, y + 82);

      // D. Tagline — use only ASCII-safe drawn lines + bullet
      doc.setDrawColor(255, 180, 0);
      doc.setLineWidth(0.8);
      doc.line(82, y + 93, 99, y + 93);
      doc.line(111, y + 93, 128, y + 93);
      // Center dot
      doc.setFillColor(255, 180, 0);
      doc.setDrawColor(255, 180, 0);
      doc.circle(105, y + 93, 1.5, 'FD');

      doc.setTextColor(0, 0, 120);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Take the first step today with Seatify", 105, y + 102, { align: 'center' });
      doc.text("towards a successful future.", 105, y + 109, { align: 'center' });

      // Footer separator line
      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.3);
      doc.line(15, y + 116, 195, y + 116);

      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.setFont("helvetica", "normal");
      const footerY = y + 123;
      doc.text("This is a digital receipt issued by SeatifyAI Admission System. www.seatifyai.com | Page 1 of 1", 105, footerY, { align: 'center' });
      
      doc.save(`Seatify_Receipt_${adm.applicationId}.pdf`);
      toast.success("Receipt downloaded!", { id: toastId });
    } catch (err) {
      console.error("PDF Error:", err);
      toast.error("Receipt generation failed.", { id: toastId });
    }
  };

  const StatusBadge = ({ status }) => {
    const cfg = {
      confirmed: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle, label: 'Pre Registration Confirmed' },
      pending: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: Clock, label: 'Pending' },
      rejected: { color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: AlertCircle, label: 'Rejected' },
      cancelled: { color: '#6B7280', bg: 'rgba(107,114,128,0.12)', icon: X, label: 'Cancelled' },
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
    <div className="min-h-screen pt-8 pb-32 md:pb-8 px-4" style={{ background: 'var(--bg)' }}>
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
          {tabsList.map(tab => (
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
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: 'Clash Display' }}>
                  <User size={18} style={{ color: 'var(--primary)' }} /> Personal Information
                </h2>
                {profile && !isEditing && (
                  <button
                    onClick={() => {
                      setEditForm({
                        fullName: profile.fullName || '',
                        mobile: profile.mobile || '',
                        dob: profile.dob || '',
                        community: profile.community || '',
                        parentName: profile.parentName || '',
                        parentOccupation: profile.parentOccupation || '',
                        parentMobile: profile.parentMobile || '',
                        homeTown: profile.homeTown || '',
                        district: profile.district || '',
                        districtOther: profile.districtOther || '',
                        currentQualification: profile.currentQualification || '',
                        aadhar: profile.aadhar || '',
                        email: profile.email || ''
                      });
                      setIsEditing(true);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-slate-900 text-white hover:bg-black transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Edit size={12} /> Edit Profile
                  </button>
                )}
                {profile && isEditing && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold flex items-center gap-1.5 px-3 py-1 rounded-full transition-all border"
                      style={{
                        borderColor: saveStatus === 'saving' ? '#FFE4E6' : saveStatus === 'saved' ? '#D1FAE5' : saveStatus === 'error' ? '#FEE2E2' : 'transparent',
                        background: saveStatus === 'saving' ? '#FFF1F2' : saveStatus === 'saved' ? '#ECFDF5' : saveStatus === 'error' ? '#FEF2F2' : 'transparent',
                        color: saveStatus === 'saving' ? '#E11D48' : saveStatus === 'saved' ? '#059669' : saveStatus === 'error' ? '#DC2626' : '#64748B'
                      }}>
                      {saveStatus === 'saving' && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          Saving...
                        </>
                      )}
                      {saveStatus === 'saved' && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Saved successfully
                        </>
                      )}
                      {saveStatus === 'error' && (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                          Required fields missing
                        </>
                      )}
                      {saveStatus === 'idle' && (
                        <>
                          All changes saved
                        </>
                      )}
                    </span>
                    
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-slate-900 text-white hover:bg-black transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <CheckCircle size={12} /> Done
                    </button>
                  </div>
                )}
              </div>
              {profile ? (
                !isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Student Name" value={profile.fullName} />
                    <Field label="Student contact number" value={profile.mobile} />
                    <Field label="Date of Birth" value={profile.dob} />
                    <Field label="Community" value={profile.community} />
                    <Field label="Parent name" value={profile.parentName} />
                    <Field label="Parent occupation" value={profile.parentOccupation} />
                    <Field label="Parent contact number" value={profile.parentMobile} />
                    <Field label="Home Town" value={profile.homeTown} />
                    <Field label="District" value={profile.district === 'Other' ? profile.districtOther : profile.district} />
                    {!(profile.category && (profile.category.toLowerCase() === 'k12' || profile.category.toLowerCase() === 'k-12')) && (
                      <Field label="Current Qualification" value={profile.currentQualification} />
                    )}
                    <Field label="Aadhar Number" value={profile.aadhar ? 'XXXXXXXX' + String(profile.aadhar).slice(-4) : '—'} />
                    <Field label="Email ID" value={profile.email} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-500">Student Name *</label>
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-500">Student contact number *</label>
                      <input
                        type="text"
                        value={editForm.mobile}
                        onChange={(e) => setEditForm(prev => ({ ...prev, mobile: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) }))}
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-500">Date of Birth *</label>
                      <input
                        type="date"
                        value={editForm.dob}
                        onChange={(e) => setEditForm(prev => ({ ...prev, dob: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-500">Community</label>
                      <select
                        value={editForm.community}
                        onChange={(e) => setEditForm(prev => ({ ...prev, community: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                      >
                        <option value="">Select Community</option>
                        <option value="OC">OC</option>
                        <option value="BC">BC</option>
                        <option value="BCM">BCM</option>
                        <option value="MBC">MBC</option>
                        <option value="SC">SC</option>
                        <option value="SCA">SCA</option>
                        <option value="ST">ST</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-500">Parent name</label>
                      <input
                        type="text"
                        value={editForm.parentName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, parentName: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-500">Parent occupation</label>
                      <input
                        type="text"
                        value={editForm.parentOccupation}
                        onChange={(e) => setEditForm(prev => ({ ...prev, parentOccupation: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-500">Parent contact number</label>
                      <input
                        type="text"
                        value={editForm.parentMobile}
                        onChange={(e) => setEditForm(prev => ({ ...prev, parentMobile: e.target.value.replace(/[^0-9]/g, '').slice(0, 10) }))}
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-500">Home Town</label>
                      <input
                        type="text"
                        value={editForm.homeTown}
                        onChange={(e) => setEditForm(prev => ({ ...prev, homeTown: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-500">District</label>
                      <select
                        value={editForm.district}
                        onChange={(e) => setEditForm(prev => ({ ...prev, district: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                      >
                        <option value="">Select District</option>
                        {['Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanniyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar', 'Other'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    {editForm.district === 'Other' && (
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-500">Specify District</label>
                        <input
                          type="text"
                          value={editForm.districtOther}
                          onChange={(e) => setEditForm(prev => ({ ...prev, districtOther: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                        />
                      </div>
                    )}
                    {!(profile.category && (profile.category.toLowerCase() === 'k12' || profile.category.toLowerCase() === 'k-12')) && (
                      <div>
                        <label className="block text-xs font-semibold mb-1 text-slate-500">Current Qualification</label>
                        <select
                          value={editForm.currentQualification}
                          onChange={(e) => setEditForm(prev => ({ ...prev, currentQualification: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                        >
                          <option value="">Select Qualification</option>
                          <option value="10th Std (SSLC)">10th Std (SSLC)</option>
                          <option value="12th Std (HSC)">12th Std (HSC)</option>
                          <option value="Diploma Holder">Diploma Holder</option>
                          <option value="UG (Degree Completed / Pursuing)">UG (Degree Completed / Pursuing)</option>
                          <option value="PG (Degree Completed / Pursuing)">PG (Degree Completed / Pursuing)</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-500">Aadhar Number</label>
                      <input
                        type="text"
                        value={editForm.aadhar}
                        onChange={(e) => setEditForm(prev => ({ ...prev, aadhar: e.target.value }))}
                        maxLength={12}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-500">Email ID *</label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                      />
                    </div>
                  </div>
                )
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
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <Field label="Institution Name" value={adm.collegeName || 'SNS Institutions'} />
                        <Field label="Application ID" value={adm.applicationId} />
                        <Field label="Amount Paid" value={`₹${((adm.fee || 0)).toLocaleString('en-IN')}`} />
                        <Field label="Payment ID" value={adm.paymentId} />
                        <Field label="Date" value={adm.createdAt ? new Date(adm.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) : ''} />
                      </div>
                      {(adm.paymentStatus === 'completed' || adm.paymentId) && adm.status !== 'cancelled' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownloadReceipt(adm)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-gray-900 text-white hover:bg-black transition-all"
                          >
                            <Download size={14} /> Receipt
                          </button>
                          {adm.status !== 'rejected' && adm.status !== 'cancelled' && (
                            <button
                              onClick={() => setConfirmCancel(adm)}
                              className="px-4 py-2.5 rounded-xl text-xs font-bold border border-red-100 text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      )}
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

          {activeTab === 'Documents' && (
            <>
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ fontFamily: 'Clash Display' }}>
                <FileText size={18} style={{ color: 'var(--primary)' }} /> Documents
              </h2>

              <div className="space-y-8">
                {confirmedAdmissions.map(adm => {
                  const requiredDocs = getDocumentRequirements(adm.courseName, adm.category);
                  const uploadedDocs = adm.docs || {};
                  
                  const missingDocs = requiredDocs.filter(d => !uploadedDocs[d.id]);
                  const actualUploaded = requiredDocs.filter(d => typeof uploadedDocs[d.id] === 'string' && uploadedDocs[d.id].trim() !== '');

                  return (
                    <div key={adm._id} className="rounded-xl p-6 space-y-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)' }}>
                      <div>
                        <p className="font-semibold text-lg">{adm.courseName}</p>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{adm.programName} | ID: {adm.applicationId}</p>
                      </div>

                      {/* 1. Pending Documents Section (Above) */}
                      {missingDocs.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-500 flex items-center gap-1.5 mb-2">
                            <AlertCircle size={14} /> Pending Documents ({missingDocs.length})
                          </h4>
                          <div className="space-y-3">
                            {missingDocs.map(doc => {
                              const isUploadingThis = uploadProgress && uploadProgress[doc.id] !== undefined;
                              const currentPercent = isUploadingThis ? uploadProgress[doc.id] : 0;
                              return (
                                <div key={doc.id} className="flex flex-col gap-2.5 p-3 rounded-xl border border-red-100 bg-red-50/30">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <span className="font-medium text-sm text-red-900">{doc.label}</span>
                                    {!isUploadingThis ? (
                                      <label className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 justify-center w-full sm:w-auto">
                                        <Upload size={14} /> Upload
                                        <input 
                                          type="file" 
                                          className="hidden" 
                                          accept=".pdf,.jpg,.jpeg,.png"
                                          onChange={(e) => handleUploadPendingDoc(adm.applicationId, doc.id, e.target.files[0])}
                                        />
                                      </label>
                                    ) : (
                                      <span className="text-xs font-extrabold text-emerald-600 animate-pulse">
                                        Uploading... {currentPercent}%
                                      </span>
                                    )}
                                  </div>
                                  
                                  {isUploadingThis && (
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-0.5">
                                      <div 
                                        className="h-full bg-emerald-500 transition-all duration-300 rounded-full" 
                                        style={{ width: `${currentPercent}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 2. Uploaded Documents Section (Below) */}
                      <div className="space-y-3 pt-4 border-t" style={{ borderColor: 'var(--card-border)' }}>
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5 mb-2">
                          <CheckCircle size={14} /> Uploaded Documents ({actualUploaded.length})
                        </h4>
                        {actualUploaded.length > 0 ? (
                          <div className="space-y-2">
                            {actualUploaded.map(doc => {
                              const docUrl = uploadedDocs[doc.id];
                              const finalUrl = docUrl.startsWith('http') || docUrl.startsWith('/') ? docUrl : `/uploads/${docUrl}`;
                              
                              return (
                                <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                  <span className="font-medium text-sm text-slate-700">{doc.label}</span>
                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <a 
                                      href={finalUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors text-center"
                                    >
                                      View
                                    </a>
                                    <button 
                                      onClick={() => setConfirmDelete({ applicationId: adm.applicationId, docKey: doc.id, label: doc.label })}
                                      className="flex-1 sm:flex-none px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors text-center"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400">No documents uploaded yet.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Custom Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 p-6 shadow-xl animate-scale-up">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Remove Document</h3>
                <p className="text-xs text-slate-500 mt-0.5">Confirm document deletion</p>
              </div>
            </div>
            
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-800">"{confirmDelete.label}"</strong>? You will need to upload it again to complete your admission checklist.
            </p>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer text-center animate-fade-in"
              >
                No, Cancel
              </button>
              <button
                onClick={async () => {
                  const { applicationId, docKey } = confirmDelete;
                  setConfirmDelete(null);
                  await handleRemoveDoc(applicationId, docKey);
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer text-center shadow-sm"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Admission Modal */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 p-6 shadow-xl animate-scale-up">
            <div className="flex items-center gap-3 mb-4 text-rose-600">
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Cancel Admission</h3>
                <p className="text-xs text-slate-500 mt-0.5">Application ID: {confirmCancel.applicationId}</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-red-800 mb-1">Warning: No Refund Policy</p>
              <p className="text-xs text-red-600 leading-relaxed">
                By proceeding with this cancellation, you acknowledge that the pre-registration fee is <strong className="font-bold">strictly non-refundable</strong>. This action will permanently release your secured seat and cannot be undone.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmCancel(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer text-center animate-fade-in"
              >
                Keep Seat
              </button>
              <button
                onClick={handleCancelAdmission}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer text-center shadow-sm"
              >
                Yes, Cancel Seat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
