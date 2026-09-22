import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import AnnouncementBanner from '../ui/AnnouncementBanner';
import { useApp } from '../../context/AppContext';

export default function AppLayout({ showSidebar = true, showFooter = true }) {
  const { isAuthenticated } = useApp();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div className="app-layout" style={{ flex: 1 }}>
        {showSidebar && <Sidebar />}
        <main className="main-content">
          {isAuthenticated && <AnnouncementBanner />}
          <Outlet />
        </main>
      </div>
      {showFooter && <Footer />}
    </div>
  );
}