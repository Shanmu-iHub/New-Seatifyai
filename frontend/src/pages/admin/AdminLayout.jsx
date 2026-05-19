import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - fixed width */}
      <AdminSidebar />
      
      {/* Main Content - pushes content right to avoid sidebar */}
      <div className="flex-1 ml-64 p-8">
        <Outlet />
      </div>
    </div>
  );
}
