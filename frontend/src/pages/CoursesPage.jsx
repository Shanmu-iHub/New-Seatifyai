import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, IndianRupee, ChevronRight, Plus, Check, ShoppingCart, Sparkles, Search, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../assets/White_Version_Logo.webp';

const CATEGORIES = ['All', 'K-12', 'Engineering & Tech', 'Arts & Science', 'Paramedical', 'Education'];

// Your Original Icon Backgrounds
const ICON_BG = {
  'AI & Data Science': { bg: '#F5F3FF', color: '#7C3AED', emoji: '🤖' },
  'Computer Science': { bg: '#EFF6FF', color: '#2563EB', emoji: '💻' },
  'Core Engineering': { bg: '#FFF7ED', color: '#D97706', emoji: '⚙️' },
  'Specialized Engineering': { bg: '#ECFDF5', color: '#059669', emoji: '🚀' },
  'PG Programs': { bg: '#FAF5FF', color: '#9333EA', emoji: '🎓' },
  'default': { bg: '#FEFCE8', color: '#CA8A04', emoji: '📚' },
};

const NAME_COLOR = {
  'AI & Data Science': '#000',
  'Computer Science': '#000',
  'Core Engineering': '#000',
  'Specialized Engineering': '#000',
  'PG Programs': '#000',
  'default': '#000',
};

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

const formatFee = (fee) => `₹${(fee / 1000).toFixed(0).replace(/\B(?=(\d+(?=\d{3}))*(?!\d))/g, ',')}K`;
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
      const res = await axios.get(`http://localhost:5000/api/courses?t=${Date.now()}`);
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
      const res = await axios.get('http://localhost:5000/api/applications/my');
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

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = filteredCourses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getIconStyle = (name) => ICON_BG[name] || ICON_BG['default'];
  const getNameColor = (name) => NAME_COLOR[name] || NAME_COLOR['default'];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#F8FAFC' }}>
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)' }} />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full opacity-10 blur-[100px]"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2DD4BF 100%)' }} />
        <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] rounded-full opacity-10 blur-[120px]"
          style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 pb-4 relative" style={{ zIndex: 1 }}>

        {/* Header */}
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

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-10 animate-fade-up">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <input
              type="text"
              placeholder="Search courses, degrees, or subjects..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl text-sm outline-none"
              style={{
                background: 'rgba(0,0,0,0.03)',
                border: '1px solid var(--card-border)',
                color: 'var(--text)',
              }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-4 flex items-center">
                <X size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
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

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-2xl h-64 animate-pulse" style={{ background: 'var(--card)' }} />
            ))}
          </div>
        )}

        {/* Original Course Cards Grid */}
        {!loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedCourses.map((course, idx) => {
                const iconStyle = getIconStyle(course.name);
                const nameColor = getNameColor(course.name);
                return (
                  <div
                    key={course._id || idx}
                    className="rounded-2xl p-5 animate-fade-up"
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--card-border)',
                      animationDelay: `${idx * 0.06}s`,
                      animationFillMode: 'both'
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: iconStyle.bg }}>
                        {course.emoji || iconStyle.emoji}
                      </div>
                      <div>
                        <h3 className="font-bold text-base leading-tight" style={{ color: nameColor, fontFamily: 'Clash Display' }}>
                          {course.name}
                        </h3>
                        <div className="mt-1 flex flex-col gap-0.5">
                          <p className="text-[11px] font-medium" style={{ color: 'var(--primary)', opacity: 0.8 }}>
                            {course.collegeName || 'SNS Institutions'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ height: '1px', background: 'var(--card-border)', marginBottom: '14px' }} />

                    <div className="space-y-3">
                      {course.programs?.map(program => (
                        <div key={program._id}>
                          <div className="flex items-start gap-2 mb-2">
                            <span className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>●</span>
                            <span className="text-sm leading-snug" style={{ color: '#D1D5DB' }}>{program.name}</span>
                          </div>
                          <div className="flex items-center justify-between ml-4">
                            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                              <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '0.85em', marginRight: '4px' }}>Pre Registration Fee:</span>
                              {formatFullFee(program.fee)}
                            </span>
                            <button
                              onClick={() => handleApply(course, program)}
                              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all active:scale-95"
                              style={{ background: 'var(--primary)' }}
                            >
                              Apply Now <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12 animate-fade-up">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-xl text-sm font-bold ${currentPage === 1 ? 'opacity-30' : ''}`}
                  style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid var(--card-border)', color: 'var(--text)' }}
                >
                  Previous
                </button>
                <span className="text-xs font-bold">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-xl text-sm font-bold ${currentPage === totalPages ? 'opacity-30' : ''}`}
                  style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid var(--card-border)', color: 'var(--text)' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Application Limit Reached</h3>
            <p className="text-slate-500 mb-6">You have already completed an application for this year.</p>
            <button onClick={() => setShowWarningModal(false)} className="w-full py-4 rounded-xl font-bold text-white" style={{ background: 'var(--primary)' }}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
}
