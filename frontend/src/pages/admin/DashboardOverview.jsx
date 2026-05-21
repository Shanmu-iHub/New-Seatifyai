import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  IndianRupee, GraduationCap, Users, LifeBuoy,
  TrendingUp, Clock, CheckCircle2, XCircle, Activity,
  Map, Smartphone, Zap, AlertCircle, FileWarning, Timer
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from 'recharts';
import toast from 'react-hot-toast';

// ── helpers ──────────────────────────────────────────────────────────
const statusBadge = (status, paymentStatus) => {
  if (paymentStatus === 'completed' && status === 'confirmed')
    return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Confirmed</span>;
  if (status === 'cancelled')
    return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">Cancelled</span>;
  if (paymentStatus === 'pending')
    return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Pending</span>;
  return <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{status}</span>;
};

const timeAgo = (date) => {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
};

const CustomTooltipRevenue = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-bold text-slate-700 mb-1">{label}</p>
        <p className="text-emerald-600 font-semibold">Revenue: ₹{payload[0]?.value?.toLocaleString('en-IN')}</p>
        <p className="text-indigo-600 font-semibold">Admissions: {payload[1]?.value}</p>
      </div>
    );
  }
  return null;
};

// ── Main Component ────────────────────────────────────────────────────
export default function DashboardOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/admin/stats');
      setStats(res.data);
    } catch {
      toast.error('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-[80vh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const statCards = [
    { title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: <IndianRupee size={22} />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { title: 'Total Admissions', value: stats.totalAdmissions, icon: <GraduationCap size={22} />, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { title: 'Total Students', value: stats.totalStudents, icon: <Users size={22} />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { title: 'Pending Payments', value: stats.pendingCount, icon: <Clock size={22} />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { title: 'Active Tickets', value: stats.activeTickets, icon: <LifeBuoy size={22} />, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
  ];

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800" style={{ fontFamily: 'Clash Display' }}>Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Live analytics and platform insights for Seatifyai.</p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className={`bg-white rounded-2xl p-5 shadow-sm border ${card.border} flex flex-col gap-3`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.title}</p>
              <h3 className="text-2xl font-black text-slate-800 mt-0.5">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 1: Revenue Chart + Funnel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Revenue & Admissions 14-day Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-500" /> Revenue & Payment Analytics</h2>
              <p className="text-xs text-slate-500 mt-0.5">Daily revenue and admission count — last 14 days</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAdmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={8} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dx={-4} tickFormatter={v => `₹${v}`} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dx={4} />
                <Tooltip content={<CustomTooltipRevenue />} />
                <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area yAxisId="right" type="monotone" dataKey="admissions" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAdmissions)" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-3 justify-center">
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-1.5 rounded bg-emerald-500 inline-block"></span>Revenue</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-1.5 rounded bg-indigo-500 inline-block"></span>Admissions</div>
          </div>
        </div>

        {/* Admission Funnel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2"><Activity size={18} className="text-indigo-500" /> Admission Funnel</h2>
          <p className="text-xs text-slate-500 mb-5">Student lifecycle from registration to confirmation</p>
          <div className="space-y-3">
            {stats.admissionFunnel.map((item, i, arr) => {
              const maxCount = Math.max(...arr.map(a => a.count)) || 1;
              const pct = Math.round((item.count / maxCount) * 100);
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">{item.stage}</span>
                      {i > 0 && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                          {arr[i-1].count > 0 ? Math.round((item.count / arr[i-1].count) * 100) : 0}% conversion
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-slate-800">{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: item.fill }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment Pie */}
          <div className="mt-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Payment Status Split</p>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.paymentBreakdown} cx="50%" cy="50%" innerRadius={35} outerRadius={58} paddingAngle={3} dataKey="value">
                    {stats.paymentBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [val, name]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 2: College Bar + Course Seats Bar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* College-wise Admissions Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
            <GraduationCap size={18} className="text-indigo-500" /> College-wise Admission Analytics
          </h2>
          <p className="text-xs text-slate-500 mb-5">Confirmed admissions per institution</p>
          {stats.collegeAdmissions.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">No admission data yet</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.collegeAdmissions} margin={{ top: 5, right: 10, left: 0, bottom: 30 }} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="short"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                    interval={0}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-sm max-w-[220px]">
                            <p className="font-bold text-slate-800 mb-1 leading-snug">{d.college}</p>
                            <p className="text-indigo-600 font-semibold">{d.count} Admissions</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={55}>
                    {stats.collegeAdmissions.map((_, i) => (
                      <Cell key={i} fill={`hsl(${240 + i * 18}, 70%, ${55 + i * 3}%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Course-wise Seat Availability Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
            <TrendingUp size={18} className="text-indigo-500" /> Top Performing Courses
          </h2>
          <p className="text-xs text-slate-500 mb-5">Highest enrolled programs (filled vs available seats)</p>
          {stats.courseSeatChart.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">No course seat data yet</div>
          ) : (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.courseSeatChart} margin={{ top: 0, right: 10, left: 0, bottom: 0 }} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="short" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} angle={-20} textAnchor="end" height={45} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }} 
                    content={({ active, payload }) => {
                      if (active && payload?.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-sm max-w-[240px]">
                            <p className="font-bold text-slate-800 mb-2 leading-snug">{d.name}</p>
                            <div className="flex flex-col gap-1">
                              <p className="text-indigo-600 font-semibold flex items-center justify-between"><span>Filled Seats:</span> <span>{d.filled}</span></p>
                              <p className="text-emerald-500 font-semibold flex items-center justify-between"><span>Available:</span> <span>{d.available}</span></p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="filled" name="Filled" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={35} />
                  <Bar dataKey="available" name="Available" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Admission Intelligence Section ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Intelligence Cards */}
        <div className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><Timer size={18} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Avg Completion</p>
              <h3 className="text-lg font-black text-slate-800">{stats.admissionIntelligence.avgCompletionTime} mins</h3>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center"><AlertCircle size={18} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Payment Failures</p>
              <h3 className="text-lg font-black text-slate-800">{stats.admissionIntelligence.failedPayments}</h3>
            </div>
          </div>
          <div 
            className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => navigate('/admin/admissions?payment=completed&status=pending')}
          >
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center"><FileWarning size={18} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Docs Pending</p>
              <h3 className="text-lg font-black text-slate-800">{stats.admissionIntelligence.docsPending}</h3>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={18} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Drop-off Rate</p>
              <h3 className="text-lg font-black text-slate-800">
                {stats.admissionFunnel[1].count > 0 ? Math.max(0, 100 - Math.round((stats.admissionFunnel[stats.admissionFunnel.length-1].count / stats.admissionFunnel[1].count) * 100)) : 0}%
              </h3>
            </div>
          </div>
        </div>

        {/* State/City Heatmap */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2"><Map size={18} className="text-indigo-500" /> Geographic Origin</h2>
          <p className="text-xs text-slate-500 mb-5">Top applying states/cities</p>
          {stats.admissionIntelligence.topStates.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No geographic data</div>
          ) : (
            <div className="space-y-4 mt-2">
              {stats.admissionIntelligence.topStates.map((state, i) => {
                const max = stats.admissionIntelligence.topStates[0].value;
                return (
                  <div 
                    key={i} 
                    className="flex items-center gap-3 text-sm cursor-pointer hover:bg-slate-50 p-1.5 -mx-1.5 rounded-lg transition-colors group"
                    onClick={() => navigate(`/admin/admissions?district=${encodeURIComponent(state.name)}`)}
                  >
                    <span className="w-24 truncate font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">{state.name}</span>
                    <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(state.value / max) * 100}%` }}></div>
                    </div>
                    <span className="font-bold text-slate-600 w-8 text-right">{state.value}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Peak Timings & Device Usage */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2"><Zap size={18} className="text-amber-500" /> Peak Timings</h2>
          <p className="text-xs text-slate-500 mb-5">Most active application hours</p>
          {stats.admissionIntelligence.peakTimings.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">No timing data</div>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.admissionIntelligence.peakTimings.map((time, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-[10px]">{i+1}</div>
                    <span className="text-sm font-semibold text-slate-700">{time.time}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">{time.count} apps</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2"><Smartphone size={18} className="text-emerald-500" /> Device Usage</h2>
          <p className="text-xs text-slate-500 mb-5">Mobile vs Desktop</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.admissionIntelligence.deviceUsage} cx="50%" cy="50%" innerRadius={25} outerRadius={45} paddingAngle={2} dataKey="value">
                  {stats.admissionIntelligence.deviceUsage.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val}%`, 'Usage']} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 4: Real-Time Activity Feed ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Real-Time Admission Activity Feed
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Most recent 10 applications across all colleges</p>
          </div>
          <button onClick={fetchStats} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">↻ Refresh</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Application</th>
                <th className="text-left pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Student</th>
                <th className="text-left pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">College</th>
                <th className="text-left pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Program</th>
                <th className="text-right pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Fee</th>
                <th className="text-center pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right pb-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentActivity.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-400">No activity yet</td></tr>
              ) : (
                stats.recentActivity.map((item, i) => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-mono text-xs font-bold text-indigo-600">{item.applicationId || '—'}</td>
                    <td className="py-3 font-medium text-slate-700">{item.studentName}</td>
                    <td className="py-3 text-slate-500 max-w-[140px] truncate">{item.college}</td>
                    <td className="py-3 text-slate-500 max-w-[120px] truncate">{item.program}</td>
                    <td className="py-3 text-right font-semibold text-slate-800">₹{item.fee.toLocaleString('en-IN')}</td>
                    <td className="py-3 text-center">{statusBadge(item.status, item.paymentStatus)}</td>
                    <td className="py-3 text-right text-xs text-slate-400">{timeAgo(item.createdAt)}</td>
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
