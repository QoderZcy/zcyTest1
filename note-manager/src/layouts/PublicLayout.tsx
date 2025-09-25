// Public layout for blog pages

import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicHeader } from '../components/layouts/PublicHeader';
import { PublicFooter } from '../components/layouts/PublicFooter';
import { PublicSidebar } from '../components/layouts/PublicSidebar';

export const PublicLayout: React.FC = () => {
  return (
    <div className="public-layout">
      <PublicHeader />
      
      <main className="main-content">
        <div className="content-container">
          <div className="content-area">
            <Outlet />
          </div>
          
          <aside className="sidebar">
            <PublicSidebar />
          </aside>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
};