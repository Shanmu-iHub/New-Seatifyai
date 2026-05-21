import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, Download, Eye, XCircle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAdmissions() {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('district') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    try {
      const res = await axios.get('/api/admin/admissions');
      setAdmissions(res.data);
    } catch (err) {
      toast.error('Failed to load admissions data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed': return <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 w-max"><CheckCircle size={12}/> Confirmed</span>;
      case 'cancelled': return <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1 w-max"><XCircle size={12}/> Cancelled</span>;
      default: return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1 w-max"><Clock size={12}/> Pending</span>;
    }
  };

  const filtered = admissions.filter(a => {
    const matchesSearch = a.applicationId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.collegeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.district?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || a.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800" style={{ fontFamily: 'Clash Display' }}>Admissions</h1>
          <p className="text-slate-500 mt-1">View and manage all student applications.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-700 bg-white"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium text-slate-700 bg-white"
          >
            <option value="all">All Payments</option>
            <option value="completed">Paid</option>
            <option value="pending">Unpaid</option>
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search ID, Name, College, District..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full sm:w-64"
            />
          </div>
          <button className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-medium hover:bg-slate-800 transition-colors">
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-bold">Application ID</th>
                <th className="p-4 font-bold">Student Name</th>
                <th className="p-4 font-bold">College & Course</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Applied On</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No admissions found.</td></tr>
              ) : (
                filtered.map(app => (
                  <tr key={app._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-indigo-600">{app.applicationId}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{app.fullName || app.student?.name || 'N/A'}</p>
                      <p className="text-xs text-slate-500">{app.email || app.student?.email}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-700">{app.collegeName}</p>
                      <p className="text-xs text-slate-500">{app.courseName} - {app.programName}</p>
                    </td>
                    <td className="p-4">{getStatusBadge(app.status)}</td>
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
