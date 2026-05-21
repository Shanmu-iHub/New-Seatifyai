import React, { useEffect } from 'react';

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-slate-800">
      <h1 className="text-3xl md:text-5xl font-black text-indigo-600 mb-8" style={{ fontFamily: 'Clash Display' }}>Privacy Policy</h1>
      
      <div className="prose prose-indigo max-w-none space-y-6">
        <p className="text-slate-500">Last updated: May 2026</p>
        
        <h2 className="text-2xl font-bold mt-8">1. Information We Collect</h2>
        <p>We collect information that you provide directly to us when using SeatifyAI, including:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Personal Information:</strong> Name, email address, mobile number, date of birth.</li>
          <li><strong>Academic Information:</strong> Previous school/college details, marks, chosen programs.</li>
          <li><strong>Documents:</strong> Uploaded identification and academic certificates (Aadhar, Marksheets).</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8">2. How We Use Your Information</h2>
        <p>We use the collected information for various purposes, including:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Processing your college admission applications.</li>
          <li>Communicating with you regarding application status and updates.</li>
          <li>Sharing necessary details with the educational institutions you applied to.</li>
          <li>Improving and personalizing our platform services.</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8">3. Information Sharing and Disclosure</h2>
        <p>We do not sell your personal information. We only share your data with:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Partner Institutions:</strong> Specifically, the colleges you have submitted an application for.</li>
          <li><strong>Service Providers:</strong> Third-party services required for our operations (e.g., payment gateways like Razorpay, SMS providers like 2Factor).</li>
        </ul>

        <h2 className="text-2xl font-bold mt-8">4. Data Security</h2>
        <p>We implement appropriate technical and organizational security measures designed to protect your personal data against accidental or unlawful destruction, loss, alteration, and unauthorized disclosure or access.</p>

        <h2 className="text-2xl font-bold mt-8">5. Your Rights</h2>
        <p>You have the right to access, update, or request deletion of your personal information. Contact us at support@seatifyai.com to exercise these rights.</p>
      </div>
    </div>
  );
}
