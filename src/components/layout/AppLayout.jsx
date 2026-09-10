import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

export default function AppLayout({ showSidebar = true, showFooter = true }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
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
