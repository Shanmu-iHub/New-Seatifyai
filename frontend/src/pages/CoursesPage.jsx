import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, IndianRupee, ChevronRight, Plus, Check, ShoppingCart, Sparkles, Search, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'K-12', 'Engineering & Tech', 'Arts & Science', 'Paramedical', 'Education'];

// Icon backgrounds per category
const ICON_BG = {
  'AI & Data Science': { bg: '#F5F3FF', color: '#7C3AED', emoji: '🤖' },
  'Computer Science': { bg: '#EFF6FF', color: '#2563EB', emoji: '💻' },
  'Core Engineering': { bg: '#FFF7ED', color: '#D97706', emoji: '⚙️' },
  'Specialized Engineering': { bg: '#ECFDF5', color: '#059669', emoji: '🚀' },
  'PG Programs': { bg: '#FAF5FF', color: '#9333EA', emoji: '🎓' },
  'default': { bg: '#FEFCE8', color: '#CA8A04', emoji: '📚' },
};

const NAME_COLOR = {
  'AI & Data Science': '#5B21B6',
  'Computer Science': '#1E40AF',
  'Core Engineering': '#B45309',
  'Specialized Engineering': '#065F46',
  'PG Programs': '#6B21A8',
  'default': '#A16207',
};

// Mock data for demo (backend will serve this)
const MOCK_COURSES = [
  {
    _id: '1', name: 'AI & Data Science', type: 'B.E./B.Tech', category: 'Engineering & Tech',
    programs: [
      { name: 'Artificial Intelligence & Data Science', fee: 120000, seats: 45, _id: 'p1' },
      { name: 'Artificial Intelligence & Machine Learning', fee: 115000, seats: 30, _id: 'p2' },
      { name: 'Data Science *', fee: 110000, seats: 60, _id: 'p3' },
    ]
  },
  {
    _id: '2', name: 'Computer Science', type: 'B.E./B.Tech', category: 'Engineering & Tech',
    programs: [
      { name: 'Computer Science and Engineering', fee: 125000, seats: 50, _id: 'p4' },
      { name: 'Computer Science and Design', fee: 118000, seats: 40, _id: 'p5' },
      { name: 'Computer Science and Technology', fee: 116000, seats: 35, _id: 'p6' },
      { name: 'CSE (IOT & Cyber Security)', fee: 122000, seats: 25, _id: 'p7' },
      { name: 'Information Technology', fee: 112000, seats: 55, _id: 'p8' },
    ]
  },
  {
    _id: '3', name: 'Core Engineering', type: 'B.E./B.Tech', category: 'Engineering & Tech',
    programs: [
      { name: 'Mechanical & Mechatronics', fee: 108000, seats: 60, _id: 'p9' },
      { name: 'Mechanical Engineering', fee: 105000, seats: 70, _id: 'p10' },
      { name: 'Civil Engineering', fee: 100000, seats: 80, _id: 'p11' },
      { name: 'Electrical & Electronics Engg.', fee: 110000, seats: 45, _id: 'p12' },
      { name: 'Electronics & Communication', fee: 112000, seats: 50, _id: 'p13' },
    ]
  },
  {
    _id: '4', name: 'Specialized Engineering', type: 'B.E./B.Tech', category: 'Engineering & Tech',
    programs: [
      { name: 'Aerospace Engineering', fee: 130000, seats: 20, _id: 'p14' },
      { name: 'Mechatronics Engineering', fee: 115000, seats: 30, _id: 'p15' },
      { name: 'Bio-Medical Engineering', fee: 118000, seats: 25, _id: 'p16' },
      { name: 'Food Technology', fee: 98000, seats: 40, _id: 'p17' },
    ]
  },
  {
    _id: '5', name: 'PG Programs', type: 'MBA/MCA', category: 'Engineering & Tech',
    programs: [
      { name: 'MBA', fee: 80000, seats: 60, _id: 'p18' },
      { name: 'MCA', fee: 75000, seats: 50, _id: 'p19' },
      { name: 'MBA in Business Analytics', fee: 90000, seats: 30, _id: 'p20' },
      { name: 'Ph.D - CIVIL, CSE, ECE, EEE, Mech.', fee: 60000, seats: 15, _id: 'p21' },
    ]
  },
  {
    _id: '6', name: 'Science Stream', type: 'Class 11-12', category: 'K-12',
    programs: [
      { name: 'Physics, Chemistry, Maths (PCM)', fee: 45000, seats: 80, _id: 'p22' },
      { name: 'Physics, Chemistry, Biology (PCB)', fee: 45000, seats: 80, _id: 'p23' },
      { name: 'Computer Science (PCMC)', fee: 50000, seats: 60, _id: 'p24' },
    ]
  },
  {
    _id: '7', name: 'Commerce Stream', type: 'Class 11-12', category: 'K-12',
    programs: [
      { name: 'Accountancy, Business Studies, Economics', fee: 40000, seats: 90, _id: 'p25' },
      { name: 'Commerce with Computer Applications', fee: 42000, seats: 70, _id: 'p26' },
    ]
  },
  {
    _id: '8', name: 'B.Sc Programs', type: 'Bachelor of Science', category: 'Arts & Science',
    programs: [
      { name: 'B.Sc Computer Science', fee: 65000, seats: 60, _id: 'p27' },
      { name: 'B.Sc Mathematics', fee: 55000, seats: 70, _id: 'p28' },
      { name: 'B.Sc Physics', fee: 55000, seats: 65, _id: 'p29' },
    ]
  },
  {
    _id: '9', name: 'Nursing', type: 'B.Sc Nursing', category: 'Paramedical',
    programs: [
      { name: 'B.Sc Nursing (4 years)', fee: 95000, seats: 40, _id: 'p30' },
      { name: 'GNM Nursing (3 years)', fee: 70000, seats: 50, _id: 'p31' },
    ]
  },
  {
    _id: '10', name: 'B.Ed Programs', type: 'Bachelor of Education', category: 'Education',
    programs: [
      { name: 'B.Ed (2 years)', fee: 50000, seats: 100, _id: 'p32' },
      { name: 'B.Ed Special Education', fee: 55000, seats: 60, _id: 'p33' },
    ]
  },
];

const formatFee = (fee) => `₹${(fee / 1000).toFixed(0).replace(/\B(?=(\d+(?=\d{3}))*(?!\d))/g, ',')}K/yr`;
const formatFullFee = (fee) => `₹${fee.toLocaleString('en-IN')}/yr`;

export default function CoursesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('All');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  const handleApply = (course, program) => {
    if (!user) {
      toast('Please login to start your application', { icon: '👋' });
      navigate('/login', { state: { from: `/apply/${course._id}`, course, program } });
      return;
    }
    navigate(`/apply/${course._id}`, { state: { course, program } });
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/courses');
      setCourses(res.data);
    } catch {
      // Use mock data if backend not available
      setCourses(MOCK_COURSES);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesTab = activeTab === 'All' || course.category === activeTab;
    const q = searchQuery.toLowerCase().replace(/\s+/g, '');
    
    const matchesSearch = !searchQuery || 
      course.name.toLowerCase().replace(/\s+/g, '').includes(q) || 
      course.category.toLowerCase().replace(/\s+/g, '').includes(q) ||
      course.programs.some(p => p.name.toLowerCase().replace(/\s+/g, '').includes(q));
    
    return matchesTab && matchesSearch;
  });



  const handleApplyNow = (course, program) => {
    navigate(`/apply/${course._id}`, { state: { course, program } });
  };

  const getIconStyle = (name) => ICON_BG[name] || ICON_BG['default'];
  const getNameColor = (name) => NAME_COLOR[name] || NAME_COLOR['default'];

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-10 pb-4">

        {/* Header */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-4"
            style={{ border: '1px solid var(--primary)', color: 'var(--primary)', background: 'rgba(79,70,229,0.08)' }}>
            <Sparkles size={13} />
            Programs Offered
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-3" style={{ fontFamily: 'Clash Display' }}>
            Courses & Programs
          </h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
            Comprehensive programs across Engineering, Arts & Science, Health Sciences, and more.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary">
              <Search size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            <input
              type="text"
              placeholder="Search courses, degrees, or subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl text-sm transition-all outline-none"
              style={{ 
                background: 'rgba(0,0,0,0.03)', 
                border: '1px solid var(--card-border)',
                color: 'var(--text)',
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-4 flex items-center"
              >
                <X size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto tabs-scroll pb-2 mb-8 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          {CATEGORIES.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: activeTab === tab ? 'var(--primary)' : '#fff',
                color: activeTab === tab ? '#fff' : 'var(--text-muted)',
                border: '1px solid var(--card-border)',
                boxShadow: activeTab === tab ? '0 4px 12px rgba(59,130,246,0.25)' : 'none'
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

        {/* Course Cards Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((course, idx) => {
              const iconStyle = getIconStyle(course.name);
              const nameColor = getNameColor(course.name);
              return (
                <div
                  key={course._id}
                  className="course-card rounded-2xl p-5 animate-fade-up"
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--card-border)',
                    animationDelay: `${idx * 0.06}s`,
                    animationFillMode: 'both'
                  }}
                >
                  {/* Card Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: iconStyle.bg }}>
                      {course.emoji || iconStyle.emoji}
                    </div>
                    <div>
                      <h3 className="font-bold text-base leading-tight" style={{ color: nameColor, fontFamily: 'Clash Display' }}>
                        {course.name}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{course.type}</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: '1px', background: 'var(--card-border)', marginBottom: '14px' }} />

                  {/* Programs list */}
                  <div className="space-y-3">
                    {course.programs.map(program => {
                      const key = `${course._id}-${program._id}`;

                      return (
                        <div key={program._id}>
                          <div className="flex items-start gap-2 mb-2">
                            <span className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>●</span>
                            <span className="text-sm leading-snug" style={{ color: '#D1D5DB' }}>{program.name}</span>
                          </div>
                          <div className="flex items-center justify-between ml-4">
                            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                              {formatFullFee(program.fee)}
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApply(course, program)}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white transition-all transform hover:scale-105"
                                style={{ background: 'var(--primary)' }}
                              >
                                Apply Now <ChevronRight size={14} />
                              </button>
                            </div>
                          </div>
                          {program.seats <= 20 && (
                            <div className="ml-4 mt-1">
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.12)', color: '#FCA5A5' }}>
                                Only {program.seats} seats left!
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Seats summary */}
                  <div className="mt-4 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid var(--card-border)' }}>
                    <Users size={13} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {course.programs.reduce((a, p) => a + (p.seats || 0), 0)} seats available across {course.programs.length} programs
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-20">
            <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
            <p style={{ color: 'var(--text-muted)' }}>No courses found in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
