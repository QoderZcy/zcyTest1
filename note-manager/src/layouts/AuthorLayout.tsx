// Author layout for content creation and management

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthorHeader } from '../components/layouts/AuthorHeader';
import { AuthorSidebar } from '../components/layouts/AuthorSidebar';
import { Menu, X } from 'lucide-react';

export const AuthorLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="author-layout">
      <AuthorHeader />
      
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
          <AuthorSidebar onItemClick={() => setSidebarOpen(false)} />
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