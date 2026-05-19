import React, { useState } from 'react';
import axios from 'axios';
import { ShieldAlert, CheckCircle, UserPlus, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePromote = async (e) => {
    e.preventDefault();
    if (!identifier) return toast.error('Please enter a mobile or email');
    
    setLoading(true);
    try {
      const res = await axios.post('/api/admin/promote', { identifier });
      toast.success(res.data.message || 'User promoted to Admin!');
      setIdentifier('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to promote user. Are you sure they are registered?');
    } finally {
      setLoading(false);
    }
  };

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
                disabled={loading}
                type="submit"
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <CheckCircle size={18} />}
                {loading ? 'Promoting...' : 'Promote to Admin'}
              </button>
            </form>
          </div>
        </div>

        {/* Global Configurations Placeholder */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden opacity-75">
          <div className="bg-slate-50 p-6 border-b border-slate-200 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
              <Save size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Platform Configuration</h2>
              <p className="text-sm text-slate-500">Global application settings</p>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Platform Fee (₹)</label>
                <input 
                  type="number" 
                  value="1.00"
                  disabled
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Support Email</label>
                <input 
                  type="email" 
                  value="support@seatifyai.com"
                  disabled
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              
              <button disabled className="w-full bg-slate-200 text-slate-500 font-bold py-3 rounded-xl mt-4 cursor-not-allowed">
                Save Configurations (Coming Soon)
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
