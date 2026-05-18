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
  const [existingDocs, setExistingDocs] = useState({});
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    dob: '',
    admissionType: 'Regular',
    email: user?.email || '', mobile: user?.mobile || '',
    docs: { aadhar: null, previousSchoolTC: null, community: null, birthCertificate: null, marksheet10: null, marksheet12: null, diplomaCertificate: null }
  });

  const update = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));
  const updateDoc = (field, file) => setFormData(prev => ({ ...prev, docs: { ...prev.docs, [field]: file } }));

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
            fullName: app.fullName,
            dob: app.dob,
            admissionType: app.admissionType || 'Regular',
            email: app.email,
            mobile: app.mobile,
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
      const requiredFields = ['fullName', 'dob', 'email', 'mobile'];
      const missing = requiredFields.filter(f => !formData[f]);
      if (missing.length > 0) {
        toast.error('Please fill all required fields');
        return;
      }

      // Validate mobile number - must be 10 digits only
      const mobileRegex = /^[0-9]{10}$/;
      if (!mobileRegex.test(formData.mobile)) {
        toast.error('Mobile number must be exactly 10 digits');
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

  const handleSubmit = async () => {
    const requiredDocs = getDocumentRequirements().filter(d => d.required);
    const missing = requiredDocs.filter(d => !formData.docs[d.id] && !existingDocs[d.id]);

    if (missing.length > 0) {
      toast.error(`Please upload: ${missing.map(m => m.label.replace(' *', '')).join(', ')}`);
      return;
    }
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
          state: { application: res.data.application, course, program }
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
        toast.success('Application submitted! Proceeding to payment...');
        navigate(`/payment/${res.data.applicationId}`, {
          state: { application: res.data, course, program }
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
    <div className="min-h-screen py-8 px-4" style={{ background: 'var(--bg)' }}>
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
                <InputField label="Full Name" value={formData.fullName} onChange={e => update('fullName', e.target.value)} required />
              </div>
              <InputField label="Date of Birth" type="date" value={formData.dob} onChange={e => update('dob', e.target.value)} required />
              {course?.category === 'Engineering & Tech' && (
                <SelectField label="Admission Type" value={formData.admissionType} onChange={e => update('admissionType', e.target.value)}
                  options={['Regular', 'Lateral Entry']} required />
              )}
              <InputField label="Email ID" type="email" value={formData.email} onChange={e => update('email', e.target.value)} required />
              <InputField label="Mobile Number" type="tel" value={formData.mobile} onChange={e => update('mobile', e.target.value.replace(/[^0-9]/g, '').slice(0, 10))} required pattern="[0-9]{10}" maxLength={10} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                Upload clear scans or photos (PDF, JPG, PNG. Max 10MB).
              </p>

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
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
              style={{ background: 'var(--primary)', color: '#fff', opacity: loading ? 0.7 : 1 }}>
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{editId ? 'Saving...' : 'Submitting...'}</>
                : <><span>{editId ? 'Save Changes' : 'Submit & Pay'}</span><ChevronRight size={16} /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
