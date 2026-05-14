import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  const [course, setCourse] = useState(state?.course || null);
  const [program, setProgram] = useState(state?.program || null);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    dob: '', gender: '',
    email: user?.email || '', mobile: user?.mobile || '',
    docs: { aadhar: null, marksheet10: null, community: null }
  });

  const update = (field, val) => setFormData(prev => ({ ...prev, [field]: val }));
  const updateDoc = (field, file) => setFormData(prev => ({ ...prev, docs: { ...prev.docs, [field]: file } }));

  // Fallback for missing state
  useEffect(() => {
    if (!course || !program) {
      toast.error('Application context lost. Please select a course again.');
      navigate('/courses');
    }
  }, [course, program, navigate]);

  const handleNext = () => {
    if (step === 1) {
      const requiredFields = ['fullName', 'dob', 'gender', 'email', 'mobile'];
      const missing = requiredFields.filter(f => !formData[f]);
      if (missing.length > 0) {
        toast.error('Please fill all required fields');
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

  const handleSubmit = async () => {
    if (!formData.docs.aadhar) {
      toast.error('Aadhar Card is required');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => {
        if (k !== 'docs') fd.append(k, v);
      });
      Object.entries(formData.docs).forEach(([k, v]) => {
        if (v) fd.append(`doc_${k}`, v);
      });
      fd.append('courseId', course?._id);
      fd.append('courseName', course?.name);
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
    } catch (err) {
      // For demo purposes without backend:
      const mockId = 'SEATIFY-' + new Date().getFullYear() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      toast.success('Application submitted! Proceeding to payment...');
      navigate(`/payment/${mockId}`, { state: { application: { applicationId: mockId, ...formData }, course, program } });
    } finally {
      setLoading(false);
    }
  };

  const DocUpload = ({ label, field, accept }) => (
    <div className="rounded-xl p-4 transition-all cursor-pointer group"
      style={{ border: `2px dashed ${formData.docs[field] ? 'var(--primary)' : 'var(--card-border)'}`, background: formData.docs[field] ? 'var(--primary-light)' : '#fff' }}>
      <label className="cursor-pointer flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
          style={{ background: formData.docs[field] ? 'rgba(59,130,246,0.2)' : 'var(--bg)' }}>
          {formData.docs[field] ? <Check size={18} className="text-blue-600" /> : <Upload size={18} style={{ color: 'var(--text-muted)' }} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800">{label}</p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {formData.docs[field] ? formData.docs[field].name : `Click to upload (${accept})`}
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
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Fee: ₹{program.fee?.toLocaleString('en-IN')}/yr</p>
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
            Step {step}: {STEPS[step - 1].title}
          </h2>

          {/* Step 1 */}
          {step === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <InputField label="Full Name" value={formData.fullName} onChange={e => update('fullName', e.target.value)} required />
              </div>
              <InputField label="Date of Birth" type="date" value={formData.dob} onChange={e => update('dob', e.target.value)} required />
              <SelectField label="Gender" value={formData.gender} onChange={e => update('gender', e.target.value)}
                options={['Male', 'Female', 'Other']} required />
              <InputField label="Email ID" type="email" value={formData.email} onChange={e => update('email', e.target.value)} required />
              <InputField label="Mobile Number" type="tel" value={formData.mobile} onChange={e => update('mobile', e.target.value)} required />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
                Upload clear scans or photos (PDF, JPG, PNG. Max 10MB).
              </p>
              <DocUpload label="Aadhar Card *" field="aadhar" accept=".pdf,image/*" />
              <DocUpload label="10th Mark Sheet" field="marksheet10" accept=".pdf,image/*" />
              <DocUpload label="Community Certificate" field="community" accept=".pdf,image/*" />
            </div>
          )}
        </div>

        {/* Navigation */}
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
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</>
                : <><span>Submit & Pay</span><ChevronRight size={16} /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
