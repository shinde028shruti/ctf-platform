import React from 'react';
import { Construction } from 'lucide-react';

export default function AdminPlaceholder({ title }) {
  return (
    <div className="page-container">
      <div className="section-title mb-2">Admin</div>
      <h1 style={{ marginBottom: 32 }}>{title}</h1>
      <div style={{
        background: 'var(--bg-card)', border: '1px dashed var(--border-bright)',
        borderRadius: 16, padding: '60px 32px', textAlign: 'center',
      }}>
        <Construction size={48} color="var(--accent-yellow)" style={{ marginBottom: 16 }} />
        <h4 style={{ marginBottom: 8 }}>{title}</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: 400, margin: '0 auto' }}>
          This admin section is scaffolded and ready for backend integration. Connect your API to populate this view.
        </p>
      </div>
    </div>
  );
}
