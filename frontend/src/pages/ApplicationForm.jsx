import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Upload, Check, ChevronRight, ChevronLeft, User, BookOpen, FileText } from 'lucide-react';

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

const MinimumQualificationAgreement = ({ qualification, checked, onChange, required }) => (
  <div className="sm:col-span-2">
    <div
      className="rounded-xl border p-4"
      style={{ background: '#fff', borderColor: 'var(--card-border)' }}
    >
      <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
        Minimum Qualification {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      <p className="text-sm font-bold mb-4" style={{ color: 'var(--text)' }}>
        {qualification || 'Minimum qualification required for this program'}
      </p>

      <label
        className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all"
        style={{
          background: checked ? 'rgba(79,70,229,0.06)' : 'rgba(248,250,252,0.9)',
          border: checked ? '2px solid var(--primary)' : '1px solid var(--card-border)',
        }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required={required}
          className="mt-1 h-4 w-4 rounded"
        />
        <span className="text-sm font-medium leading-6" style={{ color: checked ? 'var(--primary)' : 'var(--text)' }}>
          I agree I have the minimum qualification for this program.
        </span>
      </label>
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
  const minimumQualification = (
    program?.minimumQualification ||
    program?.minmumQualification ||
    course?.minimumQualification ||
    course?.minmumQualification ||
    ''
  ).trim();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    minimumQualificationAgreed: false,
    aadhar: '',
    physicalApplicationNo: '',
    docs: { aadhar: null, previousSchoolTC: null, community: null, birthCertificate: null, marksheet10: null, marksheet12: null, diplomaCertificate: null, admissionForm: null }
  });

  const update = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));
  const updateDoc = (field, file) => setFormData(prev => ({ ...prev, docs: { ...prev.docs, [field]: file } }));
  const updateMinimumQualificationAgreement = (checked) => {
    setFormData(prev => ({
      ...prev,
      minimumQualificationAgreed: checked,
      currentQualification: checked ? (minimumQualification || 'Minimum qualification confirmed') : '',
    }));
  };

  useEffect(() => {
    if (formData.minimumQualificationAgreed && minimumQualification && formData.currentQualification !== minimumQualification) {
      setFormData(prev => ({ ...prev, currentQualification: minimumQualification }));
    }
  }, [minimumQualification, formData.minimumQualificationAgreed, formData.currentQualification]);

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
            minimumQualificationAgreed: Boolean(app.currentQualification),
            aadhar: app.aadhar || '',
            physicalApplicationNo: app.physicalApplicationNo || '',
          }));
          setExistingDocs(app.docs || {});

          // Always set a baseline course/program from the application data
          // This ensures getDocumentRequirements() works even if the live fetch fails
          setCourse({
            name: app.courseName,
            category: app.category,
            collegeName: app.collegeName,
            minimumQualification: app.currentQualification || ''
          });
          setProgram({
            name: app.programName,
            fee: app.fee,
            minimumQualification: app.currentQualification || ''
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
        'aadhar'
      ];
      const missing = requiredFields.filter(f => !formData[f]);
      if (missing.length > 0) {
        toast.error('Please fill all required fields');
        return;
      }

      if (!formData.minimumQualificationAgreed || !formData.currentQualification) {
        toast.error('Please confirm that you have the minimum qualification');
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
      setShowConfirm(true);
    } else {
      processSubmission();
    }
  };

  const processSubmission = async () => {
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

        const res = await axios.post('/api/applications', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Clear autosave draft on successful submission
        const draftKey = `seatify_app_draft_${user?.email || 'guest'}`;
        localStorage.removeItem(draftKey);

        toast.success('Application submitted! Proceeding to payment...');
        navigate(`/payment/${res.data.applicationId}`, {
          state: { application: res.data, course, program },
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
              
              <MinimumQualificationAgreement
                qualification={minimumQualification}
                checked={formData.minimumQualificationAgreed}
                onChange={updateMinimumQualificationAgreement}
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
                : <><span>{editId ? 'Save Changes' : 'Submit & Pay'}</span><ChevronRight size={16} /></>}
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirm && (
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
