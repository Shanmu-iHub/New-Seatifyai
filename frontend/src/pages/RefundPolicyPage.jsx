import React, { useEffect } from 'react';

export default function RefundPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-slate-800">
      <h1 className="text-3xl md:text-5xl font-black text-indigo-600 mb-8" style={{ fontFamily: 'Clash Display' }}>Refund Policy</h1>
      
      <div className="prose prose-indigo max-w-none space-y-6">
        <p className="text-slate-500">Last updated: May 2026</p>
        
        <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl my-8">
          <h3 className="font-bold text-amber-800 text-lg mb-2">Non-Refundable Policy</h3>
          <p className="text-amber-700">Please note that all pre-registration and application fees paid through SeatifyAI are strictly <strong>NON-REFUNDABLE</strong> under any circumstances.</p>
        </div>

        <h2 className="text-2xl font-bold mt-8">1. Application Fees</h2>
        <p>The fees collected on the SeatifyAI platform serve as an administrative and pre-registration charge to secure and process your application with the respective college or institution. Once an application is submitted and payment is successfully processed, the transaction is considered final.</p>

        <h2 className="text-2xl font-bold mt-8">2. Exceptions</h2>
        <p>We do not offer refunds for any of the following scenarios:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Change of mind after submitting the application.</li>
          <li>Admission rejection by the institution due to unmet eligibility criteria.</li>
          <li>Failure to submit required physical documents to the college.</li>
          <li>Cancellation of admission by the student.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8">3. Duplicate Payments</h2>
        <p>In the rare event of a technical failure resulting in a duplicate payment for the exact same application, SeatifyAI will process a refund for the duplicate transaction. The original transaction will remain non-refundable.</p>
        <p>To report a duplicate payment, please contact our support team within 48 hours of the transaction.</p>

        <h2 className="text-2xl font-bold mt-8">4. Contact Us</h2>
        <p>For any billing inquiries or to report duplicate transactions, please email us at <a href="mailto:support@seatifyai.com" className="text-indigo-600 font-medium">support@seatifyai.com</a> or use the support module in your dashboard.</p>
      </div>
    </div>
  );
}
