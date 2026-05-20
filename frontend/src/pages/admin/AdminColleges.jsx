import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Building, ArrowRight, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function AdminColleges() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [accounts, setAccounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCollegesData();
  }, []);

  const fetchCollegesData = async () => {
    try {
      const [coursesRes, accountsRes] = await Promise.all([
        axios.get('/api/courses'),
        axios.get('/api/admin/college-accounts')
      ]);
      setCourses(coursesRes.data);

      // Create quick lookup map for account mappings
      const accMap = {};
      accountsRes.data.forEach(acc => {
        accMap[acc.collegeName] = acc;
      });
      setAccounts(accMap);
    } catch (err) {
      toast.error('Failed to load colleges or configuration data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccount = async (collegeName) => {
    const config = accounts[collegeName] || {};
    const payoutMode = config.payoutMode || 'razorpay_route';

    if (payoutMode === 'razorpay_route' && (!config.razorpayAccountId || !config.razorpayAccountId.trim())) {
      toast.error("Please enter a valid Razorpay Connected Account ID");
      return;
    }
    if (payoutMode === 'paytm_payout' && (!config.paytmWalletNumber || !config.paytmWalletNumber.trim())) {
      toast.error("Please enter a valid Paytm Wallet / Mobile Number");
      return;
    }
    if (payoutMode === 'direct_bank' && (!config.bankDetails?.accountNumber || !config.bankDetails?.ifscCode)) {
      toast.error("Account Number and IFSC Code are required for Direct Bank payout");
      return;
    }
    
    setSavingId(collegeName);
    try {
      const res = await axios.post('/api/admin/college-accounts', {
        collegeName,
        payoutMode,
        razorpayAccountId: config.razorpayAccountId?.trim(),
        paytmWalletNumber: config.paytmWalletNumber?.trim(),
        paytmMerchantId: config.paytmMerchantId?.trim(),
        bankDetails: config.bankDetails,
        active: config.active !== undefined ? config.active : true
      });
      
      setAccounts(prev => ({
        ...prev,
        [collegeName]: res.data.account
      }));
      toast.success(`Configured ${payoutMode === 'razorpay_route' ? 'Razorpay Route' : payoutMode === 'paytm_payout' ? 'Paytm Payout' : 'Direct Bank Payout'} for ${collegeName}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSavingId(null);
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
          <p className="text-slate-500 mt-1">Configure automated split payments and settlement profiles for each institution.</p>
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
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Building size={24} />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-800 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{collegeName}</h2>
                  <p className="text-sm font-medium text-slate-500 bg-slate-50 w-max px-3 py-1 rounded-lg mb-4">
                    {collegesMap[collegeName].length} Courses Available
                  </p>
                </div>

                {/* Multi-Provider Payout Configuration */}
                <div 
                  className="mt-6 pt-4 border-t border-slate-100 space-y-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Shield size={13} className="text-emerald-500" />
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Preferred Payout Mode
                      </label>
                    </div>
                    <select
                      value={accounts[collegeName]?.payoutMode || 'razorpay_route'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAccounts(prev => ({
                          ...prev,
                          [collegeName]: { 
                            ...prev[collegeName], 
                            payoutMode: val,
                            collegeName
                          }
                        }));
                      }}
                      className="px-2 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    >
                      <option value="razorpay_route">Razorpay Route</option>
                      <option value="paytm_payout">Paytm Payout</option>
                      <option value="direct_bank">Direct Bank Transfer</option>
                    </select>
                  </div>

                  {/* Mode 1: Razorpay Route */}
                  {(accounts[collegeName]?.payoutMode || 'razorpay_route') === 'razorpay_route' && (
                    <div className="space-y-1.5">
                      <input 
                        type="text"
                        placeholder="Razorpay Connected Account ID"
                        value={accounts[collegeName]?.razorpayAccountId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAccounts(prev => ({
                            ...prev,
                            [collegeName]: { ...prev[collegeName], razorpayAccountId: val }
                          }));
                        }}
                        className="w-full px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  )}

                  {/* Mode 2: Paytm Payout */}
                  {accounts[collegeName]?.payoutMode === 'paytm_payout' && (
                    <div className="space-y-2">
                      <input 
                        type="text"
                        placeholder="Paytm Wallet / Phone Number"
                        value={accounts[collegeName]?.paytmWalletNumber || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAccounts(prev => ({
                            ...prev,
                            [collegeName]: { ...prev[collegeName], paytmWalletNumber: val }
                          }));
                        }}
                        className="w-full px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                      <input 
                        type="text"
                        placeholder="Paytm Merchant ID (Optional)"
                        value={accounts[collegeName]?.paytmMerchantId || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAccounts(prev => ({
                            ...prev,
                            [collegeName]: { ...prev[collegeName], paytmMerchantId: val }
                          }));
                        }}
                        className="w-full px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  )}

                  {/* Mode 3: Direct Bank Transfer */}
                  {accounts[collegeName]?.payoutMode === 'direct_bank' && (
                    <div className="space-y-2">
                      <input 
                        type="text"
                        placeholder="Beneficiary Name"
                        value={accounts[collegeName]?.bankDetails?.beneficiaryName || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAccounts(prev => ({
                            ...prev,
                            [collegeName]: { 
                              ...prev[collegeName], 
                              bankDetails: { 
                                ...(prev[collegeName]?.bankDetails || {}), 
                                beneficiaryName: val 
                              } 
                            }
                          }));
                        }}
                        className="w-full px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="text"
                          placeholder="Bank Name"
                          value={accounts[collegeName]?.bankDetails?.bankName || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAccounts(prev => ({
                              ...prev,
                              [collegeName]: { 
                                ...prev[collegeName], 
                                bankDetails: { 
                                  ...(prev[collegeName]?.bankDetails || {}), 
                                  bankName: val 
                                } 
                              }
                            }));
                          }}
                          className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                        <input 
                          type="text"
                          placeholder="IFSC Code"
                          value={accounts[collegeName]?.bankDetails?.ifscCode || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAccounts(prev => ({
                              ...prev,
                              [collegeName]: { 
                                ...prev[collegeName], 
                                bankDetails: { 
                                  ...(prev[collegeName]?.bankDetails || {}), 
                                  ifscCode: val 
                                } 
                              }
                            }));
                          }}
                          className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                      </div>
                      <input 
                        type="text"
                        placeholder="Account Number"
                        value={accounts[collegeName]?.bankDetails?.accountNumber || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAccounts(prev => ({
                            ...prev,
                            [collegeName]: { 
                              ...prev[collegeName], 
                              bankDetails: { 
                                ...(prev[collegeName]?.bankDetails || {}), 
                                accountNumber: val 
                              } 
                            }
                          }));
                        }}
                        className="w-full px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                      />
                    </div>
                  )}

                  <button
                    onClick={() => handleSaveAccount(collegeName)}
                    disabled={savingId === collegeName}
                    className="w-full py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg transition-all shadow-sm"
                  >
                    {savingId === collegeName ? 'Saving Configuration...' : 'Save Configuration'}
                  </button>
                </div>
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
