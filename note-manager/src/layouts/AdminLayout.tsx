// Admin layout for system management

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminHeader } from '../components/layouts/AdminHeader';
import { AdminSidebar } from '../components/layouts/AdminSidebar';
import { Menu, X } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
      <AdminHeader />
      
      <div className="layout-container">
        {/* Mobile sidebar toggle */}
        <button 
          className="sidebar-toggle md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <AdminSidebar onItemClick={() => setSidebarOpen(false)} />
        </aside>

        {/* Main content */}
        <main className="main-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>

        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="sidebar-overlay md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
};