import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Upload, Check, ChevronRight, ChevronLeft, User, BookOpen, FileText, AlertTriangle, ExternalLink } from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Personal Details', icon: User },
  { id: 2, title: 'Document Upload', icon: FileText },
];

const InputField = ({ label, required, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
      {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
    </label>
    <input
      className="w-full rounded-xl px-4 py-2.5 text-sm transition-all"
      style={{ background: '#fff', border: '1px solid var(--card-border)', color: 'var(--text)' }}
      required={required}
      {...props}
    />
  </div>
);

const SelectField = ({ label, options, required, ...props }) => (
  <div>
    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
      {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
    </label>
    <select
      className="w-full rounded-xl px-4 py-2.5 text-sm transition-all"
      style={{ background: '#fff', border: '1px solid var(--card-border)', color: 'var(--text)' }}
      required={required}
      {...props}
    >
      <option value="">Select...</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const RadioField = ({ label, name, options, value, onChange, required }) => (
  <div className="sm:col-span-2">
    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
      {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
    </label>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {options.map(opt => {
        const isSelected = value === opt;
        return (
          <label
            key={opt}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer text-xs font-bold transition-all select-none"
            style={{
              background: isSelected ? 'rgba(79,70,229,0.06)' : '#fff',
              border: isSelected ? '2px solid var(--primary)' : '1px solid var(--card-border)',
              color: isSelected ? 'var(--primary)' : 'var(--text)',
            }}
          >
            <input
              type="radio"
              name={name}
              value={opt}
              checked={isSelected}
              onChange={() => onChange(opt)}
              className="hidden"
            />
            <div
              className="w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-all"
              style={{
                borderColor: isSelected ? 'var(--primary)' : 'var(--card-border)',
                borderWidth: isSelected ? '4.5px' : '1px',
                background: '#fff'
              }}
            />
            <span>{opt}</span>
          </label>
        );
      })}
    </div>
  </div>
);

const DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
  "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
  "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
  "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
  "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
  "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
  "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
  "Vellore", "Viluppuram", "Virudhunagar", "Other"
];

const POLICY_VERSION = 'v1.0';

const TERMS_POINTS = [
  'Seat reservation is processed only after successful application submission and payment confirmation.',
  'Applicants are responsible for reviewing personal details, selected course information, and uploaded documents before continuing.',
  'Providing incorrect or incomplete information may delay verification or affect admission status.',
  'Final admission remains subject to institutional verification, eligibility review, and seat availability.'
];

const REFUND_POINTS = [
  'All pre-registration and application payments are strictly non-refundable.',
  'Refunds will not be issued for duplicate submissions, change of mind, incomplete documentation, or eligibility-related outcomes.',
  'Only gateway-confirmed successful transactions will be considered valid payments.',
  'Applicants should contact the admissions or support team before making payment if they need clarification.'
];

const GridRadioField = ({ label, name, options, value, onChange, required }) => (
  <div className="sm:col-span-2">
    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
      {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
    </label>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-3 border rounded-xl" style={{ borderColor: 'var(--card-border)', background: '#fcfcfc' }}>
      {options.map(opt => {
        const isSelected = value === opt;
        return (
          <label
            key={opt}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-[11px] font-bold transition-all select-none"
            style={{
              background: isSelected ? 'rgba(79,70,229,0.06)' : '#fff',
              border: isSelected ? '2px solid var(--primary)' : '1px solid var(--card-border)',
              color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            <input
              type="radio"
              name={name}
              value={opt}
              checked={isSelected}
              onChange={() => onChange(opt)}
              className="hidden"
            />
            <div
              className="w-3 h-3 rounded-full flex items-center justify-center border transition-all"
              style={{
                borderColor: isSelected ? 'var(--primary)' : 'var(--card-border)',
                borderWidth: isSelected ? '3.5px' : '1px',
                background: '#fff'
              }}
            />
            <span className="truncate">{opt}</span>
          </label>
        );
      })}
    </div>
  </div>
);

export default function ApplicationForm() {
  const { state } = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  const [course, setCourse] = useState(state?.course || null);
  const [program, setProgram] = useState(state?.program || null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [activePolicyTab, setActivePolicyTab] = useState('terms');
  const [existingDocs, setExistingDocs] = useState({});
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    dob: '',
    admissionType: 'Regular',
    email: user?.email || '', mobile: user?.mobile || '',
    community: '',
    communityOther: '',
    parentName: '',
    parentOccupation: '',
    parentMobile: '',
    homeTown: '',
    district: '',
    districtOther: '',
    currentQualification: '',
    aadhar: '',
    physicalApplicationNo: '',
    docs: { aadhar: null, previousSchoolTC: null, community: null, birthCertificate: null, marksheet10: null, marksheet12: null, diplomaCertificate: null, admissionForm: null }
  });

  const update = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));
  const updateDoc = (field, file) => setFormData(prev => ({ ...prev, docs: { ...prev.docs, [field]: file } }));

  // Load draft from localStorage on mount (only for new applications, not edit modes)
  useEffect(() => {
    if (!editId) {
      const draftKey = `seatify_app_draft_${user?.email || 'guest'}`;
      try {
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setFormData(prev => ({
            ...prev,
            ...parsed,
            docs: prev.docs // Keep docs empty/default as Files can't be JSON serialized
          }));
          toast.success('Restored draft from autosave 💾', { id: 'draft-restore' });
        }
      } catch (err) {
        console.error('Failed to load application draft:', err);
      }
    }
  }, [editId, user]);

  // Autosave to localStorage on form text fields changes
  useEffect(() => {
    if (!editId) {
      const draftKey = `seatify_app_draft_${user?.email || 'guest'}`;
      const { docs, ...textData } = formData;
      
      // Check if at least one field has been custom-entered by checking values different from initial defaults
      const hasCustomData = Object.entries(textData).some(([k, val]) => {
        if (k === 'fullName' && val === (user?.name || '')) return false;
        if (k === 'email' && val === (user?.email || '')) return false;
        if (k === 'mobile' && val === (user?.mobile || '')) return false;
        if (k === 'admissionType' && val === 'Regular') return false;
        return val !== '';
      });
      
      if (hasCustomData) {
        localStorage.setItem(draftKey, JSON.stringify(textData));
      }
    }
  }, [formData, editId, user]);

  useEffect(() => {
    if (!showConfirm) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showConfirm]);

  // Fetch data if editing
  useEffect(() => {
    let isMounted = true;
    if (editId) {
      const fetchEditData = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`/api/applications/${editId}`);
          if (!isMounted) return;
          const app = res.data;
          
          setFormData(prev => ({
            ...prev,
            fullName: app.fullName || '',
            dob: app.dob || '',
            admissionType: app.admissionType || 'Regular',
            email: app.email || '',
            mobile: app.mobile || '',
            community: app.community || '',
            communityOther: app.communityOther || '',
            parentName: app.parentName || '',
            parentOccupation: app.parentOccupation || '',
            parentMobile: app.parentMobile || '',
            homeTown: app.homeTown || '',
            district: app.district || '',
            districtOther: app.districtOther || '',
            currentQualification: app.currentQualification || '',
            aadhar: app.aadhar || '',
            physicalApplicationNo: app.physicalApplicationNo || '',
          }));
          setExistingDocs(app.docs || {});

          // Always set a baseline course/program from the application data
          // This ensures getDocumentRequirements() works even if the live fetch fails
          setCourse({
            name: app.courseName,
            category: app.category,
            collegeName: app.collegeName
          });
          setProgram({
            name: app.programName,
            fee: app.fee
          });

          // Then try to fetch live course/program info for richer banner details if possible
          if (app.courseId) {
            try {
              const courseRes = await axios.get(`/api/courses/${app.courseId}`);
              if (!isMounted) return;
              setCourse(courseRes.data);
              const prog = courseRes.data.programs.find(p => p._id === app.programId);
              if (prog) setProgram(prog);
            } catch (courseErr) {
              console.warn('Could not fetch live course details, using application baseline');
            }
          }
        } catch (err) {
          console.error(err);
          if (isMounted) toast.error('Failed to load application data for editing');
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      fetchEditData();
    }
    return () => { isMounted = false; };
  }, [editId]);

  // Fallback for missing state
  useEffect(() => {
    if (!editId && (!course || !program)) {
      toast.error('Application context lost. Please select a course again.');
      navigate('/courses');
    }
  }, [course, program, navigate, editId]);

  const handleNext = () => {
    if (step === 1) {
      const requiredFields = [
        'fullName', 
        'dob', 
        'email', 
        'mobile', 
        'community', 
        'parentName', 
        'parentOccupation', 
        'parentMobile', 
        'homeTown', 
        'district', 
        'currentQualification', 
        'aadhar'
      ];
      const missing = requiredFields.filter(f => !formData[f]);
      if (missing.length > 0) {
        toast.error('Please fill all required fields');
        return;
      }

      // If other district, must specify
      if (formData.district === 'Other' && !formData.districtOther?.trim()) {
        toast.error('Please enter your district name');
        return;
      }

      // If other community, must specify
      if (formData.community === 'Others' && !formData.communityOther?.trim()) {
        toast.error('Please specify your community name');
        return;
      }

      // Validate student mobile number - must be 10 digits only
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(formData.mobile)) {
        toast.error('Student contact number must be exactly 10 digits');
        return;
      }

      // Validate parent contact number - must be 10 digits only
      if (!mobileRegex.test(formData.parentMobile)) {
        toast.error('Parent contact number must be exactly 10 digits');
        return;
      }

      // Validate Aadhar Number - must be exactly 12 digits
      const aadharRegex = /^[0-9]{12}$/;
      if (!aadharRegex.test(formData.aadhar)) {
        toast.error('Aadhar Number must be exactly 12 digits');
        return;
      }
    }
    if (step < 2) setStep(step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getDocumentRequirements = () => {
    if (!course) return [];
    const docs = [
      { id: 'aadhar', label: 'Aadhar Card *', required: true },
      { id: 'birthCertificate', label: 'Birth Certificate', required: false },
      { id: 'community', label: 'Community Certificate', required: false },
    ];

    const category = course.category;
    const name = course.name?.toLowerCase() || '';

    if (category === 'K-12') {
      if (name.includes('grade 11') || name.includes('grade 12')) {
        docs.push({ id: 'marksheet10', label: '10th Mark Sheet', required: false });
        docs.push({ id: 'previousSchoolTC', label: 'Transfer Certificate (TC)', required: false });
      } else if (name.includes('pre kg')) {
        // No TC for Pre KG
      } else {
        docs.push({ id: 'previousSchoolTC', label: 'Transfer Certificate (TC)', required: false });
      }
    } else {
      // College categories
      docs.push({ id: 'marksheet10', label: '10th Mark Sheet', required: false });
      docs.push({ id: 'marksheet12', label: '12th Mark Sheet / Diploma Certificate', required: false });
    }
    return docs;
  };

  const handlePreSubmit = () => {
    // Validate Admission Form Group (Optional)

    const requiredDocs = getDocumentRequirements().filter(d => d.required);
    const missing = requiredDocs.filter(d => !formData.docs[d.id] && !existingDocs[d.id]);

    if (missing.length > 0) {
      toast.error(`Please upload: ${missing.map(m => m.label.replace(' *', '')).join(', ')}`);
      return;
    }
    
    if (!editId) {
      setPolicyAccepted(false);
      setActivePolicyTab('terms');
      setShowConfirm(true);
    } else {
      processSubmission();
    }
  };

  const closeConfirmationModal = () => {
    setShowConfirm(false);
    setPolicyAccepted(false);
    setActivePolicyTab('terms');
  };

  const processSubmission = async () => {
    if (!editId && !policyAccepted) {
      toast.error('Please accept the policy acknowledgement before proceeding.');
      return;
    }

    const policyAcceptance = {
      accepted: true,
      acceptedAt: new Date().toISOString(),
      policyVersion: POLICY_VERSION,
      acceptedFrom: 'application-confirmation-modal'
    };

    setShowConfirm(false);
    setLoading(true);
    try {
      if (editId) {
        // Handle Edit submission (personal details + documents)
        const fd = new FormData();
        Object.entries(formData).forEach(([k, v]) => {
          if (k !== 'docs') fd.append(k, v);
        });
        Object.entries(formData.docs).forEach(([k, v]) => {
          if (v) fd.append(`doc_${k}`, v);
        });
        fd.append('policyAcceptance', JSON.stringify(policyAcceptance));

        const res = await axios.put(`/api/applications/${editId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Details updated successfully!');
        // Redirect back to confirmation page to see updated details and download receipt
        navigate(`/confirmation/${editId}`, {
          state: { application: res.data.application, course, program },
          replace: true
        });
      } else {
        // Handle New submission
        const fd = new FormData();
        Object.entries(formData).forEach(([k, v]) => {
          if (k !== 'docs') fd.append(k, v);
        });
        Object.entries(formData.docs).forEach(([k, v]) => {
          if (v) fd.append(`doc_${k}`, v);
        });
        fd.append('courseId', course?._id);
        fd.append('courseName', course?.name);
        fd.append('collegeName', course?.collegeName || 'SNS Institutions');
        fd.append('category', course?.category);
        fd.append('programId', program?._id);
        fd.append('programName', program?.name);
        fd.append('fee', program?.fee);
        fd.append('policyAcceptance', JSON.stringify(policyAcceptance));

        const res = await axios.post('/api/applications', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Clear autosave draft on successful submission
        const draftKey = `seatify_app_draft_${user?.email || 'guest'}`;
        localStorage.removeItem(draftKey);

        toast.success('Application submitted! Proceeding to payment...');
        navigate(`/payment/${res.data.applicationId}`, {
          state: { application: res.data.application || res.data, course, program },
          replace: true
        });
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to process application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const DocUpload = ({ label, field, accept }) => (
    <div className="rounded-xl p-4 transition-all cursor-pointer group"
      style={{ 
        border: `2px dashed ${(formData.docs[field] || existingDocs[field]) ? 'var(--primary)' : 'var(--card-border)'}`, 
        background: (formData.docs[field] || existingDocs[field]) ? 'var(--primary-light)' : '#fff' 
      }}>
      <label className="cursor-pointer flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
          style={{ background: (formData.docs[field] || existingDocs[field]) ? 'rgba(59,130,246,0.2)' : 'var(--bg)' }}>
          {(formData.docs[field] || existingDocs[field]) ? <Check size={18} className="text-blue-600" /> : <Upload size={18} style={{ color: 'var(--text-muted)' }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate">{label}</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {formData.docs[field] ? formData.docs[field].name : existingDocs[field] ? 'File already uploaded (Click to change)' : `Click to upload (${accept})`}
          </p>
        </div>
        <input type="file" className="hidden" accept={accept} onChange={e => updateDoc(field, e.target.files[0])} />
      </label>
    </div>
  );

  return (
    <div className="min-h-screen pt-8 pb-32 md:pb-8 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto">

        {/* Course info banner */}
        {course && program && (
          <div className="rounded-xl p-4 mb-6 flex items-center gap-3"
            style={{ background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.25)' }}>
            <BookOpen size={20} style={{ color: 'var(--primary)' }} />
            <div>
              <p className="text-sm font-semibold">{course.name} — {program.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Pre Registration Fee: ₹{program.fee?.toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all"
                    style={{
                      background: isDone ? 'var(--green)' : isActive ? 'var(--primary)' : 'var(--card)',
                      border: `2px solid ${isDone ? 'var(--green)' : isActive ? 'var(--primary)' : 'var(--card-border)'}`,
                      color: isDone || isActive ? '#fff' : 'var(--text-muted)'
                    }}>
                    {isDone ? <Check size={16} /> : <Icon size={15} />}
                  </div>
                  <span className="text-xs mt-1 font-medium hidden sm:block"
                    style={{ color: isActive ? 'var(--text)' : 'var(--text-muted)' }}>{s.title}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 step-line"
                    style={{ background: step > s.id ? 'var(--primary)' : 'var(--card-border)' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Form Card */}
        <div className="rounded-2xl p-6 md:p-8" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <h2 className="text-xl font-bold mb-6" style={{ fontFamily: 'Clash Display' }}>
            {editId ? 'Edit Personal Details' : `Step ${step}: ${STEPS[step - 1].title}`}
          </h2>

          {/* Step 1 */}
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <InputField label="Student Name" value={formData.fullName} onChange={e => update('fullName', e.target.value)} required />
              </div>
              <InputField label="Student contact number" type="tel" value={formData.mobile} onChange={e => update('mobile', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))} required pattern="[0-9]{10}" maxLength={10} />
              <InputField label="Date of Birth" type="date" value={formData.dob} onChange={e => update('dob', e.target.value)} required />
              
              <SelectField 
                label="Community" 
                value={formData.community} 
                onChange={e => update('community', e.target.value)} 
                options={['OC', 'BC', 'BCM', 'MBC', 'DNC', 'SC', 'ST', 'Others']} 
                required 
              />
              
              {formData.community === 'Others' && (
                <div className="sm:col-span-2">
                  <InputField 
                    label="Please specify Community" 
                    value={formData.communityOther} 
                    onChange={e => update('communityOther', e.target.value)} 
                    required 
                    placeholder="Enter community name"
                  />
                </div>
              )}
              
              <InputField label="Parent name" value={formData.parentName} onChange={e => update('parentName', e.target.value)} required />
              <InputField label="Parent occupation" value={formData.parentOccupation} onChange={e => update('parentOccupation', e.target.value)} required />
              <InputField label="Parent contact number" type="tel" value={formData.parentMobile} onChange={e => update('parentMobile', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))} required pattern="[0-9]{10}" maxLength={10} />
              <InputField label="Home Town" value={formData.homeTown} onChange={e => update('homeTown', e.target.value)} required />
              
              <SelectField 
                label="District" 
                value={formData.district} 
                onChange={e => update('district', e.target.value)} 
                options={DISTRICTS} 
                required 
              />
              
              {formData.district === 'Other' && (
                <div className="sm:col-span-2">
                  <InputField 
                    label="Please specify District Name" 
                    value={formData.districtOther} 
                    onChange={e => update('districtOther', e.target.value)} 
                    required 
                    placeholder="Enter district name"
                  />
                </div>
              )}
              
              <RadioField 
                label="Current Qualification" 
                name="currentQualification" 
                options={['12th Standard', 'UG (Degree Completed / Pursuing)', 'Lateral Entry (Diploma)']} 
                value={formData.currentQualification} 
                onChange={val => update('currentQualification', val)} 
                required 
              />
              
              <InputField label="Aadhar Number" type="text" value={formData.aadhar} onChange={e => update('aadhar', e.target.value.replace(/[^0-9]/g, '').slice(0, 12))} required pattern="[0-9]{12}" maxLength={12} placeholder="12-digit number" />
              <InputField label="Email ID" type="email" value={formData.email} onChange={e => update('email', e.target.value)} required />
              
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                Upload clear scans or photos (PDF, JPG, PNG. Max 10MB).
              </p>

              {/* Grouped Admission Form Option */}
              <div className="rounded-2xl p-5 space-y-4 border border-blue-100 bg-blue-50/10 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-blue-50">
                  <span className="text-xl">📝</span>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-blue-900" style={{ fontFamily: 'Clash Display' }}>
                    Admission Form Verification
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col justify-center">
                    <InputField 
                      label="Application Number (Optional)" 
                      value={formData.physicalApplicationNo} 
                      onChange={e => update('physicalApplicationNo', e.target.value)} 
                      placeholder="Enter physical application no."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Upload Photo Copy (Optional)
                    </label>
                    <DocUpload
                      label="Upload Photo Copy"
                      field="admissionForm"
                      accept=".pdf,image/*"
                    />
                  </div>
                </div>
              </div>

              {/* Other Documents */}
              {getDocumentRequirements().map(doc => (
                <DocUpload
                  key={doc.id}
                  label={doc.label}
                  field={doc.id}
                  accept=".pdf,image/*"
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button onClick={handleBack}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--card)', border: '1px solid var(--card-border)', color: 'var(--text)' }}>
              <ChevronLeft size={16} /> Back
            </button>
          )}
          {step < 2 ? (
            <button onClick={handleNext} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--primary)', color: '#fff' }}>
              Next Step <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handlePreSubmit} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--primary)', color: '#fff', opacity: loading ? 0.7 : 1 }}>
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{editId ? 'Saving...' : 'Submitting...'}</>
                : <><span>{editId ? 'Save Changes' : 'Review & Pay'}</span><ChevronRight size={16} /></>}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[rgba(15,23,42,0.52)] backdrop-blur-md animate-fade-in">
          <div
            className="w-full max-w-5xl rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden shadow-[0_30px_90px_rgba(15,23,42,0.28)] border animate-fade-up max-h-[94vh] sm:max-h-[92vh] flex flex-col"
            style={{ background: 'var(--card)', borderColor: 'rgba(148,163,184,0.18)' }}
          >
            <div className="grid lg:grid-cols-[1.05fr_1.2fr] overflow-y-auto">
              <div
                className="relative p-5 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-r"
                style={{
                  borderColor: 'rgba(148,163,184,0.14)',
                  background: 'linear-gradient(180deg, rgba(79,70,229,0.12) 0%, rgba(255,255,255,0.96) 100%)'
                }}
              >
                <div className="absolute top-0 right-0 h-28 w-28 sm:h-40 sm:w-40 rounded-full blur-3xl opacity-40 pointer-events-none" style={{ background: 'rgba(59,130,246,0.18)' }} />
                <div className="relative">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 shadow-sm" style={{ background: 'rgba(245,158,11,0.14)', color: '#D97706' }}>
                    <AlertTriangle size={28} />
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-bold mb-3 sm:mb-4" style={{ background: 'rgba(79,70,229,0.09)', color: 'var(--primary)' }}>
                    Final Confirmation
                  </div>
                  <h3 className="text-[1.65rem] leading-tight sm:text-3xl font-bold text-slate-900 mb-2 sm:mb-3" style={{ fontFamily: 'Clash Display' }}>
                    Review Before Payment
                  </h3>
                  <p className="text-[13px] sm:text-[15px] leading-6 sm:leading-7 text-slate-600 mb-5 sm:mb-6">
                    You are about to submit your application and continue to the payment gateway. Please review the policy details and confirm your acknowledgement to proceed.
                  </p>

                  <div className="rounded-[1.4rem] sm:rounded-3xl border p-4 sm:p-5 mb-4 sm:mb-5" style={{ borderColor: 'rgba(245,158,11,0.28)', background: 'linear-gradient(180deg, rgba(255,251,235,1) 0%, rgba(255,247,237,1) 100%)' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(245,158,11,0.14)' }}>
                        <AlertTriangle size={18} className="text-amber-600" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-amber-950">All pre-registration and application payments are strictly non-refundable.</p>
                        <p className="text-sm leading-6 text-amber-900/80">Please review all entered details and uploaded documents carefully before continuing.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] sm:rounded-3xl border p-4 sm:p-5" style={{ borderColor: 'rgba(148,163,184,0.18)', background: 'rgba(255,255,255,0.74)' }}>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-3">Quick Summary</p>
                    <div className="space-y-3 text-sm text-slate-600">
                      <p>Seat reservation starts only after successful payment confirmation.</p>
                      <p>Your submitted application details will be used for verification and admission processing.</p>
                      <div className="flex items-center justify-between gap-4 pt-2 border-t" style={{ borderColor: 'rgba(148,163,184,0.14)' }}>
                        <span className="text-slate-500">Policy version</span>
                        <span className="font-semibold text-slate-900">{POLICY_VERSION}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 lg:p-8 flex flex-col min-h-[420px] sm:min-h-[460px]">
                <div className="rounded-[1.2rem] sm:rounded-2xl p-1 mb-4 sm:mb-5" style={{ background: 'rgba(15,23,42,0.04)' }}>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setActivePolicyTab('terms')}
                      className="px-2.5 sm:px-4 py-3 rounded-[0.95rem] sm:rounded-[1rem] text-[11px] sm:text-sm font-semibold transition-all flex items-center justify-center gap-1 sm:gap-2 min-h-[52px] sm:min-h-0"
                      style={{
                        background: activePolicyTab === 'terms' ? 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)' : 'transparent',
                        color: activePolicyTab === 'terms' ? '#fff' : '#475569',
                        boxShadow: activePolicyTab === 'terms' ? '0 12px 24px rgba(79,70,229,0.22)' : 'none'
                      }}
                    >
                      <ExternalLink size={16} />
                      <span className="text-center leading-4">Terms & Conditions</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePolicyTab('refund')}
                      className="px-2.5 sm:px-4 py-3 rounded-[0.95rem] sm:rounded-[1rem] text-[11px] sm:text-sm font-semibold transition-all flex items-center justify-center gap-1 sm:gap-2 min-h-[52px] sm:min-h-0"
                      style={{
                        background: activePolicyTab === 'refund' ? 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)' : 'transparent',
                        color: activePolicyTab === 'refund' ? '#fff' : '#475569',
                        boxShadow: activePolicyTab === 'refund' ? '0 12px 24px rgba(79,70,229,0.22)' : 'none'
                      }}
                    >
                      <ExternalLink size={16} />
                      <span className="text-center leading-4">Refund Policy</span>
                    </button>
                  </div>
                </div>

                <div className="rounded-[1.35rem] sm:rounded-[1.75rem] border overflow-hidden mb-4 sm:mb-5" style={{ borderColor: 'rgba(148,163,184,0.16)', background: 'rgba(248,250,252,0.72)' }}>
                  <div className="px-4 sm:px-6 py-4 border-b" style={{ borderColor: 'rgba(148,163,184,0.14)', background: 'rgba(255,255,255,0.76)' }}>
                    <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--primary)' }}>
                      {activePolicyTab === 'terms' ? 'Terms & Conditions' : 'Refund Policy'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {activePolicyTab === 'terms'
                        ? 'Please read the admission and submission terms carefully.'
                        : 'Please review the no-refund rules before you continue.'}
                    </p>
                  </div>

                  <div className="h-[220px] sm:h-[340px] overflow-y-auto px-4 sm:px-6 py-4 sm:py-5">
                    <div className="space-y-3 min-h-full">
                      {(activePolicyTab === 'terms' ? TERMS_POINTS : REFUND_POINTS).map((point, index) => (
                        <div key={`${activePolicyTab}-${index}`} className="flex items-start gap-3 rounded-[1rem] sm:rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(148,163,184,0.12)' }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'rgba(79,70,229,0.1)', color: 'var(--primary)' }}>
                            {index + 1}
                          </div>
                          <p className="text-[13px] sm:text-sm leading-6 text-slate-600">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-3 rounded-[1.2rem] sm:rounded-[1.5rem] border p-4 sm:p-5 mb-4 sm:mb-5 cursor-pointer" style={{ borderColor: policyAccepted ? 'rgba(79,70,229,0.28)' : 'rgba(148,163,184,0.18)', background: policyAccepted ? 'rgba(79,70,229,0.05)' : 'rgba(255,255,255,0.85)' }}>
                  <input
                    type="checkbox"
                    checked={policyAccepted}
                    onChange={e => setPolicyAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[13px] sm:text-sm leading-6 text-slate-700">
                    I have read and understood the Terms & Conditions and No Refund Policy, and I agree to continue with this non-refundable payment.
                  </span>
                </label>

                <div className="flex flex-col-reverse sm:flex-row gap-3 mt-auto pt-1 sm:pt-0 sticky bottom-0 bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.94)_18%,rgba(255,255,255,0.98)_100%)] sm:bg-none">
                  <button
                    onClick={closeConfirmationModal}
                    className="flex-1 py-3.5 rounded-[1.1rem] sm:rounded-2xl font-bold text-sm transition-all"
                    style={{ background: 'rgba(15,23,42,0.05)', color: '#334155', border: '1px solid rgba(148,163,184,0.16)' }}
                  >
                    Go Back
                  </button>
                  <button
                    onClick={processSubmission}
                    disabled={!policyAccepted || loading}
                    className="flex-1 py-3.5 rounded-[1.1rem] sm:rounded-2xl font-bold text-sm text-white transition-all"
                    style={{
                      background: !policyAccepted || loading ? 'linear-gradient(135deg, #94A3B8 0%, #CBD5E1 100%)' : 'linear-gradient(135deg, #4F46E5 0%, #2563EB 100%)',
                      boxShadow: !policyAccepted || loading ? 'none' : '0 18px 36px rgba(79,70,229,0.26)',
                      opacity: !policyAccepted || loading ? 0.82 : 1,
                      cursor: !policyAccepted || loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Accept & Continue to Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {false && showConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-fade-up">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Proceed to Payment?</h3>
            <p className="text-center text-gray-500 text-sm mb-6">
              You are about to submit your application and proceed to the payment gateway. Please acknowledge that the pre-registration fee is <span className="font-bold text-red-500">NON-REFUNDABLE</span> under any circumstances.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                Go Back
              </button>
              <button
                onClick={processSubmission}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
              >
                I Agree, Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
