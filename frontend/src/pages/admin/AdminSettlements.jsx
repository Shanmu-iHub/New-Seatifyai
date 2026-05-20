import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, IndianRupee, Clock, CheckCircle2, AlertTriangle, ArrowUpRight, Building } from 'lucide-react';
import toast from 'react-hot-toast';

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  processing: { label: 'Processing', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-400' },
  settled: { label: 'Settled', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
  failed: { label: 'Failed', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-400' },
};

const modeLabels = {
  razorpay_route: 'Razorpay Route',
  paytm_payout: 'Paytm Payout',
  direct_bank: 'Direct Bank',
};

export default function AdminSettlements() {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [settlingId, setSettlingId] = useState(null);

  useEffect(() => {
    fetchSettlements();
  }, [filterStatus]);

  const fetchSettlements = async () => {
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await axios.get('/api/admin/settlements', { params });
      setEntries(res.data.entries);
      setSummary(res.data.summary);
    } catch (err) {
      toast.error('Failed to load settlement data');
    } finally {
      setLoading(false);
    }
  };

  const handleSettle = async (id) => {
    const refId = prompt('Enter payment reference ID (UTR / Transaction ID):');
    if (!refId) return;

    setSettlingId(id);
    try {
      await axios.post(`/api/admin/settlements/${id}/settle`, { referenceId: refId });
      toast.success('Settlement marked as completed!');
      fetchSettlements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to settle');
    } finally {
      setSettlingId(null);
    }
  };

  const filtered = entries.filter(e =>
    e.applicationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.collegeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800" style={{ fontFamily: 'Clash Display' }}>Settlement Ledger</h1>
        <p className="text-slate-500 mt-1">Track and manage payouts to institutions — Swiggy/Zepto-style ledger engine.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
            <IndianRupee size={14} /> Total Collected
          </div>
          <p className="text-2xl font-extrabold text-slate-800">₹{(summary.totalCollected || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ArrowUpRight size={14} /> Platform Revenue
          </div>
          <p className="text-2xl font-extrabold text-indigo-600">₹{(summary.totalPlatformFee || 0).toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Clock size={14} /> Pending Payouts
          </div>
          <p className="text-2xl font-extrabold text-amber-600">{summary.pendingCount || 0}</p>
          <p className="text-xs text-slate-400 mt-1">₹{(summary.pendingAmount || 0).toLocaleString('en-IN')} outstanding</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <CheckCircle2 size={14} /> Settled
          </div>
          <p className="text-2xl font-extrabold text-emerald-600">{summary.settledCount || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by Application ID, College, or Student..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm font-medium"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="settled">Settled</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-xs">Application</th>
                <th className="text-left px-5 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-xs">College</th>
                <th className="text-left px-5 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-xs">Student</th>
                <th className="text-right px-5 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-xs">Total</th>
                <th className="text-right px-5 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-xs">Platform</th>
                <th className="text-right px-5 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-xs">College Share</th>
                <th className="text-center px-5 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-xs">Payout Mode</th>
                <th className="text-center px-5 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-xs">Status</th>
                <th className="text-center px-5 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-xs">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Building size={32} className="text-slate-300" />
                      <p>No settlement entries found.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(entry => {
                  const sc = statusConfig[entry.settlementStatus] || statusConfig.pending;
                  return (
                    <tr key={entry._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs font-bold text-indigo-600">{entry.applicationId}</td>
                      <td className="px-5 py-4 font-medium text-slate-700 max-w-[160px] truncate">{entry.collegeName}</td>
                      <td className="px-5 py-4 text-slate-600">{entry.studentName}</td>
                      <td className="px-5 py-4 text-right font-bold text-slate-800">₹{entry.totalAmount?.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-right font-semibold text-indigo-500">₹{entry.platformFee?.toFixed(2)}</td>
                      <td className="px-5 py-4 text-right font-bold text-emerald-600">₹{entry.collegeShare?.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                          {modeLabels[entry.payoutMode] || entry.payoutMode}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${sc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}></span>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {entry.settlementStatus === 'pending' ? (
                          <button
                            onClick={() => handleSettle(entry._id)}
                            disabled={settlingId === entry._id}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 rounded-lg transition-all shadow-sm"
                          >
                            {settlingId === entry._id ? 'Settling...' : 'Mark Settled'}
                          </button>
                        ) : entry.referenceId ? (
                          <span className="text-xs font-mono text-slate-400">{entry.referenceId}</span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
