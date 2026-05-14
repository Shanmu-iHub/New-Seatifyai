import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ShieldCheck, CreditCard, Smartphone, Building2, Wallet } from 'lucide-react';

const loadRazorpay = () => new Promise(resolve => {
  if (window.Razorpay) return resolve(true);
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = () => resolve(true);
  s.onerror = () => resolve(false);
  document.body.appendChild(s);
});

export default function PaymentPage() {
  const { applicationId } = useParams();
  const { state } = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [application, setApplication] = useState(state?.application);
  const [course, setCourse] = useState(state?.course);
  const [program, setProgram] = useState(state?.program);
  const baseFee = application?.fee || program?.fee || 0;
  const platformFee = 1;
  const fee = baseFee + platformFee;

  useEffect(() => {
    if (!application) {
      fetchApplication();
    }
  }, [applicationId]);

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/applications/${applicationId}`);
      setApplication(res.data);
    } catch (err) {
      toast.error('Could not load application details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Payment gateway failed to load. Please try again.');
        setLoading(false);
        return;
      }

      const res = await axios.post('/api/payment/create-order', { amount: fee, applicationId });
      const orderId = res.data.orderId;
      const razorpayKeyId = res.data.keyId;
      const razorpayTitle = res.data.title;
      const razorpayDesc = res.data.description;

      const options = {
        key: razorpayKeyId,
        amount: fee * 100,
        currency: 'INR',
        name: razorpayTitle,
        description: razorpayDesc,
        order_id: orderId,
        prefill: {
          name: application?.fullName || user?.name,
          email: application?.email || user?.email,
          contact: application?.mobile || user?.mobile,
        },
        theme: { color: '#4F46E5' },
        handler: async (response) => {
          try {
            await axios.post('/api/payment/verify', { ...response, applicationId });
            toast.success('Payment successful!');
            navigate(`/confirmation/${applicationId}`, { state: { paymentId: response.razorpay_payment_id, application, course, program } });
          } catch {
            toast.error('Payment verification failed');
          }
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => toast.error('Payment failed. Please try again.'));
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment failed to initialize. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const paymentMethods = [
    { icon: Smartphone, label: 'UPI' },
    { icon: CreditCard, label: 'Cards' },
    { icon: Building2, label: 'Net Banking' },
    { icon: Wallet, label: 'Wallets' },
  ];

  return (
    <div className="min-h-screen py-10 px-4" style={{ background: 'var(--bg)' }}>
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Clash Display' }}>Complete Payment</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Secure payment powered by Razorpay</p>
        </div>

        {/* Order Summary Card */}
        <div className="rounded-2xl p-6 mb-5" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Order Summary</h2>

          <div className="space-y-3 mb-5">
            {[
              ['Institution', application?.courseName || course?.name || 'N/A'],
              ['Program', application?.programName || program?.name || 'N/A'],
              ['Academic Year', new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)],
              ['Application ID', applicationId || 'N/A'],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between items-start gap-4">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="text-sm font-medium text-right">{val}</span>
              </div>
            ))}

            <div className="pt-2" />

            {[
              ['Pre Registration Amount', `₹${baseFee.toLocaleString('en-IN')}`],
              ['Platform Fee', `₹${platformFee.toLocaleString('en-IN')}`],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between items-start gap-4">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span className="text-sm font-medium text-right">{val}</span>
              </div>
            ))}

            <div style={{ height: '1px', background: 'var(--card-border)', margin: '8px 0' }} />

            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Amount</span>
              <span className="text-xl font-bold" style={{ color: 'var(--primary)' }}>
                ₹{fee.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Payment methods */}
          <div className="grid grid-cols-4 gap-2 mb-5">
            {paymentMethods.map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl p-2 text-center"
                style={{ background: '#FAFAFB', border: '1px solid var(--card-border)' }}>
                <Icon size={16} className="mx-auto mb-1 text-gray-500" />
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all"
            style={{
              background: loading ? 'var(--primary-dark)' : 'var(--primary)',
              color: '#fff',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(79,70,229,0.4)',
            }}>
            {loading
              ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
              : <><ShieldCheck size={18} /> Pay ₹{fee.toLocaleString('en-IN')}</>}
          </button>
        </div>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <ShieldCheck size={13} style={{ color: '#10B981' }} />
          <span>256-bit SSL Encrypted · 100% Secure · No data stored</span>
        </div>


      </div>
    </div>
  );
}
