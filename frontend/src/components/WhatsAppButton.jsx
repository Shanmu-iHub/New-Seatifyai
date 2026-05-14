import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  const phoneNumber = "919600940618"; // Added 91 for India
  const message = "Hi Seatify, I have a query regarding the admission process.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 group flex items-center gap-3"
      aria-label="Contact on WhatsApp"
    >
      <style>{`
        @keyframes custom-pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .smooth-pulse {
          animation: custom-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Tooltip */}
      <span className="hidden md:block bg-white text-gray-800 text-xs font-bold px-3 py-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 pointer-events-none"
        style={{ border: '1px solid var(--card-border)' }}>
        Chat with Admissions
      </span>
      
      {/* WhatsApp Icon */}
      <div className="relative w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-all active:scale-95"
        style={{ 
          background: '#25D366',
          boxShadow: '0 10px 25px -5px rgba(37, 211, 102, 0.4)'
        }}>
        <MessageCircle size={28} color="white" fill="white" />
        
        {/* Smoother Pulse Effect */}
        <div className="absolute inset-0 rounded-2xl smooth-pulse" style={{ background: '#25D366' }} />
      </div>
    </a>
  );
}
