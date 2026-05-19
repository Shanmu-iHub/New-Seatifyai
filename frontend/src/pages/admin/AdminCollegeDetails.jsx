import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Building, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCollegeDetails() {
  const { collegeName } = useParams();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, [collegeName]);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('/api/courses');
      // Filter out only the courses for this specific college
      const decodedName = decodeURIComponent(collegeName);
      const collegeCourses = res.data.filter(c => c.collegeName === decodedName);
      setCourses(collegeCourses);
    } catch (err) {
      toast.error('Failed to load college details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div>
      <div className="mb-8">
        <Link to="/admin/colleges" className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-4 hover:text-indigo-700 transition-colors">
          <ArrowLeft size={16} /> Back to Colleges
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Building size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800" style={{ fontFamily: 'Clash Display' }}>
              {decodeURIComponent(collegeName)}
            </h1>
            <p className="text-slate-500 mt-1">{courses.length} Courses Available</p>
          </div>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center text-slate-500 shadow-sm border border-slate-200">No courses found for this college.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course._id} className="border border-slate-200 rounded-2xl p-6 bg-white hover:border-indigo-300 hover:shadow-lg transition-all flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{course.emoji || '🎓'}</span>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 leading-tight">{course.name}</h3>
                  <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mt-1">{course.category}</p>
                </div>
              </div>
              
              <div className="mt-auto space-y-2 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Available Programs</h4>
                {course.programs.map(program => (
                  <div key={program._id} className="flex items-center justify-between text-sm p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="font-medium text-slate-700 flex items-center gap-2"><BookOpen size={14} className="text-slate-400"/> {program.name}</span>
                    <span className="font-bold text-emerald-600">₹{program.fee}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
