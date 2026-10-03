import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import AnnouncementBanner from '../ui/AnnouncementBanner';

export default function AppLayout({ showSidebar = true, showFooter = true }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      {/* Full width, above the sidebar — visible to guests, users and admins. */}
      <AnnouncementBanner />
      <div className="app-layout" style={{ flex: 1 }}>
        {showSidebar && <Sidebar />}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
      {showFooter && <Footer />}
    </div>
  );
}