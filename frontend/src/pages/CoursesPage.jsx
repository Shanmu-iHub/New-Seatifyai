import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, IndianRupee, ChevronRight, Plus, Check, ShoppingCart, Sparkles, Search, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../assets/White_Version_Logo.webp';

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
    _id: '1', name: 'AI & Data Science (MOCK)', type: 'B.E./B.Tech', category: 'Engineering & Tech', collegeName: 'Mock Institution',
    programs: [{ name: 'Mock Program', fee: 1000, seats: 10, _id: 'p1' }]
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
      console.log('📡 Fetching Real Data from Backend...');
      const res = await axios.get(`http://localhost:5000/api/courses?t=${Date.now()}`);
      console.log('✅ Real Data Loaded:', res.data.length);
      setCourses(res.data);
    } catch (err) {
      console.error('❌ Connection to Backend Failed:', err.message);
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

  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = filteredCourses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getIconStyle = (name) => ICON_BG[name] || ICON_BG['default'];

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-400 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-24 w-80 h-80 bg-purple-400 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-12 pb-20 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-block border border-indigo-100">
            Smart Admission Portal
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4" style={{ fontFamily: 'Clash Display' }}>
            Find Your Future
          </h1>
          <p className="text-slate-500 max-w-lg mx-auto">
            Browse through 100+ programs directly synced from our academic records.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by course name, college, or category..."
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveTab(cat); setCurrentPage(1); }}
                className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ${activeTab === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-64 bg-slate-200 rounded-3xl animate-pulse" />)}
          </div>
        )}

        {/* Real Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedCourses.map((course, idx) => {
              const style = getIconStyle(course.name);
              return (
                <div key={course._id || idx} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                  <div className="flex gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner" style={{ background: style.bg }}>
                      {course.emoji || style.emoji}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                        {course.name}
                      </h3>
                      <p className="text-xs font-bold text-indigo-500 uppercase tracking-tight">
                        {course.collegeName}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {course.programs?.map((prog, pIdx) => (
                      <div key={prog._id || pIdx} className="bg-slate-50 rounded-2xl p-4 border border-slate-50 group-hover:border-indigo-50 transition-all">
                        <p className="text-sm font-bold text-slate-700 mb-3">{prog.name}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">Pre-Reg Fee</p>
                            <p className="text-base font-black text-slate-900">{formatFullFee(prog.fee)}</p>
                          </div>
                          <button
                            onClick={() => handleApply(course, prog)}
                            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                          >
                            Apply <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
            <Search className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-medium">No courses found matching your criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 shadow-lg shadow-indigo-100"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
