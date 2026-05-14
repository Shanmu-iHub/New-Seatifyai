import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, IndianRupee, ChevronRight, Plus, Check, ShoppingCart, Sparkles, Search, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

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
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-blue-600 bg-blue-50 border border-blue-100 mb-6 text-sm font-bold mx-auto">
          <Sparkles size={14} /> Programs Offered
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-[#111827]" style={{ fontFamily: 'Clash Display' }}>
          Courses & Programs
        </h1>
        <p className="max-w-2xl mx-auto text-gray-500 mb-10 text-lg leading-relaxed">
          Comprehensive programs across Engineering, Arts & Science, Health Sciences, and more.
        </p>

        {/* Centered Search */}
        <div className="max-w-3xl mx-auto relative mb-12">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
          <input 
            type="text"
            placeholder="Search courses, degrees, or subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-8 py-5 rounded-[2rem] text-lg shadow-sm transition-all outline-none border border-gray-100 focus:border-blue-400 focus:ring-8 focus:ring-blue-50"
            style={{ background: '#fff' }}
          />
        </div>

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-4 tabs-scroll justify-center">
          {CATEGORIES.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-shrink-0 px-8 py-3 rounded-full text-sm font-bold transition-all transform active:scale-95"
              style={{
                background: activeTab === tab ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)' : '#fff',
                color: activeTab === tab ? '#fff' : '#6B7280',
                border: activeTab === tab ? 'none' : '1px solid #EEF0F3',
                boxShadow: activeTab === tab ? '0 12px 24px rgba(59,130,246,0.35)' : 'none'
              }}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Program Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.flatMap(course => 
            course.programs.map(program => (
              <div key={`${course._id}-${program._id}`} 
                className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col overflow-hidden group">
                
                {/* Card Top */}
                <div className="p-8">
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-transform group-hover:scale-110"
                      style={{ background: ICON_BG[course.name]?.bg || ICON_BG.default.bg }}>
                      {ICON_BG[course.name]?.emoji || ICON_BG.default.emoji}
                    </div>
                    <h3 className="text-2xl font-bold text-[#111827] leading-tight" style={{ fontFamily: 'Clash Display' }}>
                      {program.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.5)]" />
                    <span className="text-sm font-medium text-gray-400">{course.name}</span>
                  </div>

                  <div className="flex items-center justify-between mt-8">
                    <div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Fee</p>
                      <p className="text-2xl font-black text-[#111827]">₹{program.fee?.toLocaleString('en-IN')}/yr</p>
                    </div>
                    <button
                      onClick={() => handleApply(course, program)}
                      className="px-6 py-3 rounded-xl text-sm font-bold border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 group-hover:shadow-lg shadow-blue-100"
                    >
                      Apply Now <ChevronRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>

                {/* Card Bottom Bar */}
                <div className="bg-[#EFF6FF] px-8 py-4 border-t border-[#DBEAFE] mt-auto flex items-center gap-3 text-blue-700">
                  <Users size={16} />
                  <span className="text-xs font-bold tracking-wide">
                    {program.seatsAvailable || program.seats} seats available across 1 programs
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={40} className="text-blue-200" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No programs found</h3>
            <p className="text-gray-500">Try adjusting your filters or search keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
}
