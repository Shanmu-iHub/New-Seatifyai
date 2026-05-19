import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Building, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminColleges() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/courses');
      setCourses(res.data);
    } catch (err) {
      toast.error('Failed to load colleges data');
    } finally {
      setLoading(false);
    }
  };

  const filtered = courses.filter(c => 
    c.collegeName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group by College for a better view
  const collegesMap = {};
  filtered.forEach(c => {
    if (!collegesMap[c.collegeName]) {
      collegesMap[c.collegeName] = [];
    }
    collegesMap[c.collegeName].push(c);
  });

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800" style={{ fontFamily: 'Clash Display' }}>Onboarded Colleges</h1>
          <p className="text-slate-500 mt-1">Live synchronized data from Google Sheets.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search College or Course..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-64 md:w-80"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.keys(collegesMap).length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-slate-500 shadow-sm border border-slate-200">No colleges found.</div>
        ) : (
          Object.keys(collegesMap).map(collegeName => (
            <div 
              key={collegeName} 
              onClick={() => navigate(`/admin/colleges/${encodeURIComponent(collegeName)}`)}
              className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300 group flex flex-col h-full"
            >
              <div className="p-6 flex-1">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Building size={24} />
                </div>
                <h2 className="text-xl font-extrabold text-slate-800 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{collegeName}</h2>
                <p className="text-sm font-medium text-slate-500 bg-slate-50 w-max px-3 py-1 rounded-lg">
                  {collegesMap[collegeName].length} Courses Available
                </p>
              </div>
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm font-bold text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-700 transition-colors">
                View All Courses
                <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
