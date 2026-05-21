import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ShieldCheck, CreditCard, Smartphone, Building2, Wallet, AlertTriangle } from 'lucide-react';
import Dialog from '../components/Dialog';

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
  const location = useLocation();
  const { state } = location;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showNavigationWarning, setShowNavigationWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const hasPaymentHistoryGuard = useRef(false);

  const [application, setApplication] = useState(state?.application);
  const [course, setCourse] = useState(state?.course);
  const [program, setProgram] = useState(state?.program);
  const baseFee = application?.fee || program?.fee || 0;
  const platformFee = 1;
  const gstPercentage = 18;
  const gstAmount = parseFloat((platformFee * (gstPercentage / 100)).toFixed(2));
  const fee = parseFloat((baseFee + platformFee + gstAmount).toFixed(2));

  useEffect(() => {
    if (!application) {
      fetchApplication();
    }
  }, [applicationId]);

  // Prevent navigation when on payment page with unsaved payment
  useEffect(() => {
    if (application?.paymentStatus === 'completed') {
      return;
    }

    // Handle beforeunload (tab close, refresh)
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    if (!hasPaymentHistoryGuard.current) {
      window.history.pushState(
        { ...window.history.state, paymentNavigationGuard: true },
        '',
        window.location.href
      );
      hasPaymentHistoryGuard.current = true;
    }

    // Handle browser back button. The guard entry keeps this page mounted so the dialog can render.
    const handlePopState = (e) => {
      setShowNavigationWarning(true);
      setPendingNavigation(null);
      window.history.pushState(
        { ...e.state, paymentNavigationGuard: true },
        '',
        window.location.href
      );
    };
    window.addEventListener('popstate', handlePopState);

    // Handle link clicks - intercept all navigation
    const handleClickCapture = (e) => {
      // Only intercept anchor tags (links)
      let target = e.target.closest('a');
      
      if (target) {
        const href = target.getAttribute('href');
        // Only intercept internal navigation (starting with /)
        if (href && href.startsWith('/') && href !== location.pathname) {
          e.preventDefault();
          e.stopPropagation();
          setPendingNavigation(href);
          setShowNavigationWarning(true);
        }
      }
    };
    document.addEventListener('click', handleClickCapture, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClickCapture, true);
    };
  }, [application, location.pathname]);

  const handlePayLater = async () => {
    try {
      await axios.post(`/api/applications/${applicationId}/pay-later`);
      toast.success('Application marked as Pay Later. You can pay anytime from Admissions section.');
      setShowNavigationWarning(false);
      setPendingNavigation(null);
      navigate('/admissions', { replace: true });
    } catch (err) {
      toast.error('Failed to save pay later status');
    }
  };

  const handleCancelPayment = async () => {
    if (window.confirm('Are you sure you want to cancel this application? This action cannot be undone.')) {
      try {
        await axios.post(`/api/applications/${applicationId}/cancel`);
        toast.success('Application cancelled');
        setShowNavigationWarning(false);
        setPendingNavigation(null);
        navigate('/courses', { replace: true });
      } catch (err) {
        toast.error('Failed to cancel application');
      }
    }
  };

  const handleContinuePayment = () => {
    setShowNavigationWarning(false);
    setPendingNavigation(null);
  };

  const handleProceedNavigation = () => {
    setShowNavigationWarning(false);
    setPendingNavigation(null);
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
  };

  const fetchApplication = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/applications/${applicationId}`);
      if (res.data.paymentStatus === 'completed') {
        toast.error('Payment already completed for this application.');
        navigate('/courses', { replace: true });
        return;
      }
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
          setLoading(true);
          try {
            await axios.post('/api/payment/verify', { ...response, applicationId });
            toast.success('Payment successful!');
            navigate(`/confirmation/${applicationId}`, { replace: true, state: { paymentId: response.razorpay_payment_id, application, course, program } });
          } catch {
            toast.error('Payment verification failed');
            setLoading(false);
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
    <div className="min-h-screen pt-10 pb-32 md:pb-10 px-4" style={{ background: 'var(--bg)' }}>
      {/* Full-screen Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-md z-[9999] flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Clash Display' }}>Verifying Payment</h2>
          <p className="text-gray-400 animate-pulse">Please do not refresh or close this window...</p>
        </div>
      )}

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
              ['Institution Name', application?.collegeName || course?.collegeName || 'SNS Institutions'],
              ['Program', application?.programName || program?.name || 'N/A'],
              ['Course', application?.courseName || course?.name || 'N/A'],
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
              ['Pre Registration Fee', `₹${baseFee.toLocaleString('en-IN')}`],
              ['Platform Fee', `₹${platformFee.toLocaleString('en-IN')}`],
              ['GST (18% on Platform Fee)', `₹${gstAmount.toFixed(2)}`],
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
                ₹{fee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>



          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all mb-3"
            style={{
              background: loading ? 'var(--primary-dark)' : 'var(--primary)',
              color: '#fff',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(79,70,229,0.4)',
            }}>
            {loading
              ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
              : <><ShieldCheck size={18} /> Pay ₹{fee.toLocaleString('en-IN')}</>}
          </button>

          <button
            onClick={handleCancelPayment}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm text-red-500 hover:bg-red-50 transition-all border border-red-100"
          >
            Cancel Application
          </button>
        </div>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <ShieldCheck size={13} style={{ color: '#10B981' }} />
          <span>256-bit SSL Encrypted · 100% Secure · No data stored</span>
        </div>

        <Dialog
          isOpen={showNavigationWarning}
          onClose={handleContinuePayment}
          title="Unsaved Payment"
          description="Your seat is not confirmed until payment is successful. What would you like to do?"
          icon={
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
              <AlertTriangle size={24} className="text-red-500" />
            </div>
          }
        >
          <div className="space-y-3">
            <button
              onClick={handleContinuePayment}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: 'var(--primary)',
                color: '#fff',
                boxShadow: '0 4px 20px rgba(79,70,229,0.3)'
              }}
            >
              Continue Payment
            </button>

            <button
              onClick={handlePayLater}
              className="w-full py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                background: 'rgba(79,70,229,0.1)',
                color: 'var(--primary)',
                border: '1px solid rgba(79,70,229,0.25)'
              }}
            >
              Pay Later
            </button>

            <button
              onClick={handleCancelPayment}
              className="w-full py-3 rounded-xl font-bold text-sm text-red-500 transition-all border border-red-200 hover:bg-red-50"
            >
              Cancel Payment
            </button>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
