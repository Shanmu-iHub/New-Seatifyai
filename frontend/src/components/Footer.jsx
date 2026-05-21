import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="md:col-span-1">
            <Link to="/">
              <img src="/logo.webp" alt="SeatifyAI Logo" className="h-16 object-contain" />
            </Link>
            <p className="mt-4 text-sm text-slate-500 leading-relaxed">
              Revolutionizing the college admission process. We connect students with their dream institutions through a seamless, transparent platform.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">Platform</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><Link to="/courses" className="hover:text-indigo-600 transition-colors">Browse Courses</Link></li>
              <li><Link to="/support" className="hover:text-indigo-600 transition-colors">Help & Support</Link></li>
              <li><Link to="/profile" className="hover:text-indigo-600 transition-colors">My Profile</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><Link to="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-indigo-600 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/refund-policy" className="hover:text-indigo-600 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-slate-400" />
                <span>+91 96009 40618</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-slate-400" />
                <span>support@seatifyai.com</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={14} className="text-slate-400" />
                <span>Tamil Nadu, India</span>
              </li>
              <li className="pt-2">
                <a href="https://www.linkedin.com/company/seatifyai/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#0A66C2] transition-colors group">
                  <Linkedin size={16} className="text-slate-400 group-hover:text-[#0A66C2] transition-colors" />
                  <span>LinkedIn</span>
                </a>
              </li>
            </ul>
          </div>

        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-center">
          <p className="text-xs text-slate-400 text-center">
            © {new Date().getFullYear()} SeatifyAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
