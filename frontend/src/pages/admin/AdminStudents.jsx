import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Mail, Phone, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminStudents() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/admin/users');
      // Filter out admins if you only want to see students, or show everyone. Let's show all but label them.
      setUsers(res.data);
    } catch (err) {
      toast.error('Failed to load users data');
    } finally {
      setLoading(false);
    }
  };

  const filtered = users.filter(u => 
    (u.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (u.mobile?.includes(searchTerm))
  );

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800" style={{ fontFamily: 'Clash Display' }}>Students Directory</h1>
          <p className="text-slate-500 mt-1">Manage onboarded students and accounts.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search Name, Email, Mobile..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-64 md:w-80"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-bold">User</th>
                <th className="p-4 font-bold">Contact Details</th>
                <th className="p-4 font-bold">Role</th>
                <th className="p-4 font-bold">Registered On</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-500">No users found.</td></tr>
              ) : (
                filtered.map(user => (
                  <tr key={user._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                          {user.name?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{user.name || 'Student'}</p>
                          {user.dob && <p className="text-xs text-slate-500 flex items-center gap-1"><Calendar size={12}/> DOB: {user.dob}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {user.email && <p className="text-sm text-slate-600 flex items-center gap-1"><Mail size={14} className="text-slate-400"/> {user.email}</p>}
                      {user.mobile && <p className="text-sm text-slate-600 flex items-center gap-1 mt-1"><Phone size={14} className="text-slate-400"/> {user.mobile}</p>}
                    </td>
                    <td className="p-4">
                      {user.role === 'admin' ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold uppercase tracking-wide">Admin</span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wide">Student</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
