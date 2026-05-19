import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, IndianRupee, ChevronRight, Plus, Check, ShoppingCart, Sparkles, Search, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../assets/White_Version_Logo.webp';
import config from '../config';

const CATEGORIES = ['All', 'K-12', 'Engineering & Tech', 'Arts & Science', 'Paramedical', 'Education'];

const ICON_BG = {
  'AI & Data Science': { bg: '#F5F3FF', color: '#7C3AED', emoji: '🤖' },
  'Computer Science': { bg: '#EFF6FF', color: '#2563EB', emoji: '💻' },
  'Core Engineering': { bg: '#FFF7ED', color: '#D97706', emoji: '⚙️' },
  'Specialized Engineering': { bg: '#ECFDF5', color: '#059669', emoji: '🚀' },
  'PG Programs': { bg: '#FAF5FF', color: '#9333EA', emoji: '🎓' },
  'default': { bg: '#FEFCE8', color: '#CA8A04', emoji: '📚' },
};

const NAME_COLOR = { 'default': '#000' };

const MOCK_COURSES = [
  {
    _id: '1', name: 'AI & Data Science', type: 'B.E./B.Tech', category: 'Engineering & Tech', collegeName: 'SNS Institutions',
    programs: [
      { name: 'Artificial Intelligence & Data Science', fee: 120000, seats: 45, _id: 'p1' },
      { name: 'Artificial Intelligence & Machine Learning', fee: 115000, seats: 30, _id: 'p2' },
      { name: 'Data Science *', fee: 110000, seats: 60, _id: 'p3' },
    ]
  }
];

const formatFullFee = (fee) => {
  const num = Number(fee);
  if (isNaN(num)) return '₹0';
  return `₹${num.toLocaleString('en-IN')}`;
};

export default function CoursesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('All');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const [hasCompletedApplication, setHasCompletedApplication] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [cardStates, setCardStates] = useState({});
  const [globalSelected, setGlobalSelected] = useState(null);

  const navigate = useNavigate();

  const handleApply = (course, program) => {
    if (!user) {
      toast('Please login to start your application', { icon: '👋' });
      navigate('/login', { state: { from: `/apply/${course._id}`, course, program } });
      return;
    }
    if (hasCompletedApplication) {
      setShowWarningModal(true);
      return;
    }
    navigate(`/apply/${course._id}`, { state: { course, program } });
  };

  const fetchCourses = async () => {
    try {
      const res = await axios.get(`${config.API_URL}/api/courses?t=${Date.now()}`);
      setCourses(res.data);
    } catch (err) {
      console.error('Frontend Fetch Error:', err);
      setCourses(MOCK_COURSES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    if (user) {
      checkCompletedApplication();
    }
  }, [user]);

  const checkCompletedApplication = async () => {
    try {
      const res = await axios.get(`${config.API_URL}/api/applications/my`);
      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}-${currentYear + 1}`;
      const hasCompleted = res.data.some(
        app => app.paymentStatus === 'completed' &&
          app.academicYear === academicYear &&
          app.status !== 'rejected' &&
          app.status !== 'cancelled'
      );
      setHasCompletedApplication(hasCompleted);
    } catch (err) {
      console.error('Error checking completed applications:', err);
    }
  };

  const filteredCourses = Array.isArray(courses)
    ? courses.filter(course => {
      if (!course) return false;
      const matchesTab =
        activeTab === 'All' ||
        (course.category || '').trim().toLowerCase() === activeTab.trim().toLowerCase();

      const q = searchQuery.toLowerCase().replace(/\s+/g, '');

      const matchesSearch =
        !searchQuery ||
        (course.name || '').toLowerCase().replace(/\s+/g, '').includes(q) ||
        (course.category || '').toLowerCase().replace(/\s+/g, '').includes(q) ||
        (course.collegeName || '').toLowerCase().replace(/\s+/g, '').includes(q) ||
        course.programs?.some(p =>
          (p.name || '').toLowerCase().replace(/\s+/g, '').includes(q)
        );

      return matchesTab && matchesSearch;
    })
    : [];

  const groupedData = React.useMemo(() => {
    const groups = {};
    filteredCourses.forEach(course => {
      const college = course.collegeName || 'SNS Institutions';
      if (!groups[college]) {
        groups[college] = {
          collegeName: college,
          emoji: course.emoji || '🏫',
          categories: {}
        };
      }
      
      course.programs?.forEach(prog => {
        const catName = prog.name || 'General';
        if (!groups[college].categories[catName]) {
          groups[college].categories[catName] = [];
        }
        groups[college].categories[catName].push({
          course: course,
          program: prog,
          displayName: course.name,
          fee: prog.fee
        });
      });
    });
    return Object.values(groups);
  }, [filteredCourses]);

  const totalPages = Math.ceil(groupedData.length / ITEMS_PER_PAGE);
  const paginatedGroups = groupedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getIconStyle = (name) => {
    const predefined = {
      'SNS Academy': { bg: '#FFF7ED', color: '#D97706' }, // Amber
      'SNS College of Technology': { bg: '#EFF6FF', color: '#2563EB' }, // Blue
      'Dr. SNS Rajalakshmi College of Arts & Science': { bg: '#F5F3FF', color: '#7C3AED' }, // Purple
      'SNS College of Pharmacy and Health Sciences': { bg: '#ECFDF5', color: '#059669' }, // Emerald
      'SNS College of Nursing': { bg: '#FFF1F2', color: '#E11D48' }, // Rose
      'SNS College of Physiotherapy': { bg: '#F0FDFA', color: '#0D9488' }, // Teal
      'SNS College of Allied Health Science': { bg: '#EEF2FF', color: '#4F46E5' }, // Indigo
      'Dr.SNS College of Education': { bg: '#FDF4FF', color: '#C026D3' } // Fuchsia
    };
    if (name && predefined[name]) return predefined[name];

    const colors = [
      { bg: '#EFF6FF', color: '#2563EB' },
      { bg: '#F5F3FF', color: '#7C3AED' },
      { bg: '#ECFDF5', color: '#059669' },
      { bg: '#FFF7ED', color: '#D97706' },
      { bg: '#FFF1F2', color: '#E11D48' },
      { bg: '#F0FDFA', color: '#0D9488' },
      { bg: '#EEF2FF', color: '#4F46E5' },
      { bg: '#FDF4FF', color: '#C026D3' }
    ];
    let hash = 0;
    const str = name || '';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const updateCardState = (collegeName, updates) => {
    setCardStates(prev => ({ ...prev, [collegeName]: { ...prev[collegeName], ...updates } }));
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#F8FAFC' }}>
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)' }} />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full opacity-10 blur-[100px]"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2DD4BF 100%)' }} />
        <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] rounded-full opacity-10 blur-[120px]"
          style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 pb-4 relative" style={{ zIndex: 1 }}>
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-4"
            style={{ border: '1px solid var(--primary)', color: 'var(--primary)', background: 'rgba(79,70,229,0.08)' }}>
            <Sparkles size={13} />
            Secure Your Seat Today
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ fontFamily: 'Clash Display' }}>
            Courses & Programs
          </h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
            Explore admissions for K12, UG, PG & career-focused programs all in one place.
          </p>
        </div>

        <div className="max-w-xl mx-auto mb-10 animate-fade-up">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <input
              type="text"
              placeholder="Search courses, degrees, or subjects..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl text-sm outline-none shadow-sm"
              style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--card-border)', color: 'var(--text)' }}
            />
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 animate-fade-up">
          {CATEGORIES.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
              className={`flex-shrink-0 px-6 py-2.5 rounded-full text-sm font-bold transition-all relative`}
              style={{
                background: activeTab === tab ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' : 'rgba(255,255,255,0.8)',
                color: activeTab === tab ? '#fff' : '#64748B',
                border: activeTab === tab ? 'none' : '1px solid rgba(0,0,0,0.05)',
                backdropFilter: 'blur(8px)',
              }}>
              {tab}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex flex-col gap-6">
            {[1, 2].map(i => <div key={i} className="rounded-2xl h-48 animate-pulse bg-white border" />)}
          </div>
        )}

        {!loading && (
          <div className="flex flex-col gap-6">
            {(() => {
              const activeCollege = paginatedGroups.find(g => cardStates[g.collegeName]?.step === 2);
              const groupsToRender = activeCollege ? [activeCollege] : paginatedGroups;

              return groupsToRender.map((collegeGroup, idx) => {
              const style = getIconStyle(collegeGroup.collegeName);
              const state = cardStates[collegeGroup.collegeName] || { step: 1, category: null, courseId: null };
              
              return (
                <div key={collegeGroup.collegeName || idx} className="rounded-2xl p-6 bg-white border border-slate-100 shadow-sm animate-fade-up">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: style.bg, color: style.color }}>
                      {collegeGroup.emoji || style.emoji}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg leading-tight" style={{ color: style.color || '#000' }}>{collegeGroup.collegeName}</h3>
                      {state.step === 2 && (
                        <p className="text-sm font-medium text-slate-500 mt-1">{state.category}</p>
                      )}
                    </div>
                    {state.step === 2 && (
                       <button 
                         onClick={() => {
                           updateCardState(collegeGroup.collegeName, { step: 1, courseId: null });
                           if (globalSelected?.collegeName === collegeGroup.collegeName) setGlobalSelected(null);
                         }}
                         className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm cursor-pointer"
                         title="Go Back"
                       >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                       </button>
                    )}
                  </div>
                  
                  {state.step === 1 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-fade-in">
                      {Object.keys(collegeGroup.categories).map((catName) => {
                        return (
                          <button
                            key={catName}
                            onClick={() => updateCardState(collegeGroup.collegeName, { category: catName, step: 2 })}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left border-transparent bg-slate-50 hover:bg-slate-100`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 border-slate-300`}>
                            </div>
                            <span className={`text-sm font-medium text-slate-700`}>
                              {catName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-fade-in">
                      {collegeGroup.categories[state.category]?.map((item, pIdx) => {
                        const isSelected = globalSelected?.collegeName === collegeGroup.collegeName && globalSelected?.courseId === item.course._id;
                        return (
                          <button
                            key={item.course._id || pIdx}
                            onClick={() => {
                              updateCardState(collegeGroup.collegeName, { courseId: item.course._id });
                              setGlobalSelected({ collegeName: collegeGroup.collegeName, category: state.category, courseId: item.course._id });
                            }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${isSelected ? 'border-indigo-500 bg-indigo-50/50' : 'border-transparent bg-slate-50 hover:bg-slate-100'}`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-indigo-500' : 'border-slate-300'}`}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                            </div>
                            <span className={`text-sm font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                              {item.displayName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Removed inline apply bar in favor of global floating bar */}
                </div>
              );
            });
            })()}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-4 items-center">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-4 py-2 rounded-xl bg-white border text-sm font-bold">Previous</button>
            <span className="text-xs font-bold text-slate-400">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-4 py-2 rounded-xl bg-white border text-sm font-bold">Next</button>
          </div>
        )}
      </div>

      {globalSelected && (() => {
        const collegeGroup = groupedData.find(g => g.collegeName === globalSelected.collegeName);
        const selectedItem = collegeGroup?.categories[globalSelected.category]?.find(i => i.course._id === globalSelected.courseId);
        
        if (!selectedItem) return null;

        return (
          <div className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
            <div className="w-full max-w-4xl bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] p-4 md:p-5 flex items-center justify-between pointer-events-auto animate-fade-up">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-0.5">Pre Registration Fee</p>
                <p className="text-xl md:text-2xl font-bold text-slate-900 leading-none">
                  {formatFullFee(selectedItem.fee)}
                </p>
              </div>
              <button
                onClick={() => handleApply(selectedItem.course, selectedItem.program)}
                className="flex items-center gap-2 px-6 py-3 md:px-8 md:py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
              >
                Apply Now <ChevronRight size={16} />
              </button>
            </div>
          </div>
        );
      })()}

      {showWarningModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
            <h3 className="text-xl font-bold mb-2">Application Limit Reached</h3>
            <p className="text-slate-500 mb-6">You have already completed an application for this year.</p>
            <button onClick={() => setShowWarningModal(false)} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold">OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
