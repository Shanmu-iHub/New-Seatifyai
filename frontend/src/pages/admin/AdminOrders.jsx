import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Download, IndianRupee, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const StatusBadge = ({ status }) => {
  const map = {
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <CheckCircle size={12}/>, label: 'Completed' },
    confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: <CheckCircle size={12}/>, label: 'Confirmed' },
    pending:   { bg: 'bg-amber-50',   text: 'text-amber-600',   icon: <Clock size={12}/>,       label: 'Pending' },
    rejected:  { bg: 'bg-red-50',     text: 'text-red-600',     icon: <XCircle size={12}/>,     label: 'Rejected' },
    cancelled: { bg: 'bg-slate-100',  text: 'text-slate-500',   icon: <XCircle size={12}/>,     label: 'Cancelled' },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${s.bg} ${s.text}`}>
      {s.icon} {s.label}
    </span>
  );
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/admin/orders');
      setOrders(res.data);
    } catch (err) {
      toast.error('Failed to load orders data');
    } finally {
      setLoading(false);
    }
  };

  const filtered = orders.filter(o =>
    [o.applicationId, o.studentName, o.email, o.mobile, o.college, o.program, o.paymentId]
      .some(val => String(val || '').toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalRevenue = filtered.reduce((sum, o) => sum + (o.fee || 0), 0);

  const exportCSV = () => {
    if (filtered.length === 0) return toast.error('No data to export');
    const headers = ['Application ID','Student','Email','Mobile','College','Course','Program','Category','Fee','Payment Status','Payment ID','Status','Date'];
    const rows = filtered.map(o => [
      o.applicationId, o.studentName, o.email, o.mobile, o.college, o.course, o.program, o.category,
      o.fee, o.paymentStatus, o.paymentId, o.status, o.date ? new Date(o.date).toLocaleDateString('en-IN') : ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `seatify_orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('CSV downloaded!');
  };

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800" style={{ fontFamily: 'Clash Display' }}>Orders & Payments</h1>
          <p className="text-slate-500 text-sm mt-1">All completed transactions from the database.</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text" placeholder="Search orders..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none text-sm w-56 md:w-72"
            />
          </div>
          <button onClick={exportCSV} className="flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Orders</p>
          <p className="text-xl font-black text-slate-800 mt-1">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total Revenue</p>
          <p className="text-xl font-black text-emerald-600 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Confirmed</p>
          <p className="text-xl font-black text-blue-600 mt-1">{filtered.filter(o => o.status === 'confirmed').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Pending</p>
          <p className="text-xl font-black text-amber-600 mt-1">{filtered.filter(o => o.status === 'pending' || o.status === 'submitted').length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase">App ID</th>
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase">Student</th>
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase">College</th>
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase">Program</th>
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase text-center">Fee</th>
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase text-center">Payment</th>
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase text-center">Status</th>
                <th className="p-3 text-[10px] font-bold text-slate-400 uppercase text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400 text-sm">No orders found.</td></tr>
              ) : (
                filtered.map((o, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-xs font-mono font-semibold text-indigo-600">{o.applicationId}</td>
                    <td className="p-3">
                      <p className="text-sm font-semibold text-slate-700">{o.studentName}</p>
                      <p className="text-[10px] text-slate-400">{o.email}</p>
                    </td>
                    <td className="p-3 text-xs text-slate-600">{o.college}</td>
                    <td className="p-3 text-xs text-slate-600">{o.program}</td>
                    <td className="p-3 text-center text-sm font-bold text-emerald-600">₹{(o.fee||0).toLocaleString('en-IN')}</td>
                    <td className="p-3 text-center"><StatusBadge status={o.paymentStatus}/></td>
                    <td className="p-3 text-center"><StatusBadge status={o.status}/></td>
                    <td className="p-3 text-right text-xs text-slate-400">{o.date ? new Date(o.date).toLocaleDateString('en-IN') : '—'}</td>
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
