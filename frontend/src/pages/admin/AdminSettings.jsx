import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, CheckCircle, UserPlus, Save, Settings, IndianRupee, Mail, Wrench, AlertTriangle, Percent } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [identifier, setIdentifier] = useState('');
  const [promoteLoading, setPromoteLoading] = useState(false);

  // Platform Config State
  const [config, setConfig] = useState({
    platformFee: '1.00',
    platformGST: '18',
    supportEmail: 'support@seatifyai.com',
    platformName: 'Seatifyai',
    razorpayKeyId: '',
    maintenanceMode: false,
  });
  const [configLoading, setConfigLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await axios.get('/api/settings');
      setConfig({
        platformFee: res.data.platformFee?.toString() || '1.00',
        platformGST: res.data.platformGST?.toString() || '18',
        supportEmail: res.data.supportEmail || 'support@seatifyai.com',
        platformName: res.data.platformName || 'Seatifyai',
        razorpayKeyId: res.data.razorpayKeyId || '',
        maintenanceMode: res.data.maintenanceMode || false,
      });
    } catch (err) {
      toast.error('Failed to load platform configuration');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/api/settings', {
        platformFee: parseFloat(config.platformFee),
        platformGST: parseFloat(config.platformGST),
        supportEmail: config.supportEmail,
        platformName: config.platformName,
        razorpayKeyId: config.razorpayKeyId,
        maintenanceMode: config.maintenanceMode,
      });
      toast.success('Platform configuration saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handlePromote = async (e) => {
    e.preventDefault();
    if (!identifier) return toast.error('Please enter a mobile or email');
    setPromoteLoading(true);
    try {
      const res = await axios.post('/api/admin/promote', { identifier });
      toast.success(res.data.message || 'User promoted to Admin!');
      setIdentifier('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to promote user. Are you sure they are registered?');
    } finally {
      setPromoteLoading(false);
    }
  };

  // Computed: total fee including GST
  const totalFee = (parseFloat(config.platformFee) * (1 + parseFloat(config.platformGST) / 100)).toFixed(2);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800" style={{ fontFamily: 'Clash Display' }}>System Settings</h1>
        <p className="text-slate-500 mt-1">Manage platform configuration and administrative access.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Admin Access Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Admin Privileges</h2>
              <p className="text-sm text-slate-500">Promote an existing user to Administrator</p>
            </div>
          </div>
          <div className="p-6">
            <form onSubmit={handlePromote}>
              <div className="mb-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">User Mobile or Email</label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 9876543210 or user@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  The user must already be registered on Seatify before they can be promoted.
                </p>
              </div>
              <button
                disabled={promoteLoading}
                type="submit"
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {promoteLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle size={18} />}
                {promoteLoading ? 'Promoting...' : 'Promote to Admin'}
              </button>
            </form>
          </div>
        </div>

        {/* Platform Configuration — NOW LIVE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <Settings size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Platform Configuration</h2>
              <p className="text-sm text-slate-500">Live global application settings</p>
            </div>
          </div>

          {configLoading ? (
            <div className="p-6 flex items-center justify-center h-40">
              <div className="w-7 h-7 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <form onSubmit={handleSaveConfig} className="p-6">
              <div className="space-y-4">

                {/* Platform Fee + GST row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                      <IndianRupee size={14} /> Platform Fee (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={config.platformFee}
                      onChange={(e) => setConfig(prev => ({ ...prev, platformFee: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                      <Percent size={14} /> GST (%)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="100"
                      value={config.platformGST}
                      onChange={(e) => setConfig(prev => ({ ...prev, platformGST: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Live computed total */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-700">Total charged per registration</span>
                  <span className="text-lg font-extrabold text-emerald-700">₹{isNaN(totalFee) ? '—' : totalFee}</span>
                </div>

                {/* Support Email */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                    <Mail size={14} /> Support Email
                  </label>
                  <input
                    type="email"
                    value={config.supportEmail}
                    onChange={(e) => setConfig(prev => ({ ...prev, supportEmail: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                {/* Platform Name */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1">
                    <Wrench size={14} /> Platform Name
                  </label>
                  <input
                    type="text"
                    value={config.platformName}
                    onChange={(e) => setConfig(prev => ({ ...prev, platformName: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  />
                </div>

                {/* Maintenance Mode */}
                <div className="flex items-center justify-between p-4 border border-amber-200 bg-amber-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-amber-500" />
                    <div>
                      <p className="text-sm font-bold text-amber-800">Maintenance Mode</p>
                      <p className="text-xs text-amber-600">Disables new student registrations</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.maintenanceMode ? 'bg-amber-500' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${config.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save size={18} />}
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
