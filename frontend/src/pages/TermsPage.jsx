import React, { useEffect } from 'react';

export default function TermsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-slate-800">
      <h1 className="text-3xl md:text-5xl font-black text-indigo-600 mb-8" style={{ fontFamily: 'Clash Display' }}>Terms of Service</h1>
      
      <div className="prose prose-indigo max-w-none space-y-6">
        <p className="text-slate-500">Last updated: May 2026</p>
        
        <h2 className="text-2xl font-bold mt-8">1. Acceptance of Terms</h2>
        <p>By accessing and using SeatifyAI ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our services.</p>

        <h2 className="text-2xl font-bold mt-8">2. Description of Service</h2>
        <p>SeatifyAI is a platform designed to simplify the college admission process by connecting students with educational institutions. We facilitate application submission, payment processing, and application tracking.</p>

        <h2 className="text-2xl font-bold mt-8">3. User Responsibilities</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>You must provide accurate, current, and complete information during the application process.</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
          <li>You agree not to use the Platform for any illegal or unauthorized purpose.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8">4. Admission Process and Payments</h2>
        <p>SeatifyAI acts as an intermediary. Admission decisions are solely at the discretion of the respective educational institutions. The pre-registration fees collected via the Platform are subject to our Refund Policy.</p>

        <h2 className="text-2xl font-bold mt-8">5. Intellectual Property</h2>
        <p>All content, features, and functionality on the Platform are owned by SeatifyAI and are protected by international copyright, trademark, and other intellectual property laws.</p>

        <h2 className="text-2xl font-bold mt-8">6. Limitation of Liability</h2>
        <p>SeatifyAI shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service, or any admission decisions made by partner institutions.</p>

        <h2 className="text-2xl font-bold mt-8">7. Contact Information</h2>
        <p>If you have any questions about these Terms, please contact us at support@seatifyai.com.</p>
      </div>
    </div>
  );
}
