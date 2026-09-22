import React, { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';

const EXPORT_TARGETS = [
  { key: 'excel', label: 'Export as Excel', icon: FileSpreadsheet, color: 'var(--accent-green)' },
  { key: 'pdf',   label: 'Export as PDF',   icon: FileText,        color: 'var(--accent-red)' },
];

export default function ExportMenu({ label = 'Export', onExport, disabled, busy }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
        onClick={() => setOpen(o => !o)}
        disabled={disabled || busy}
      >
        {busy ? <span className="spinner-border spinner-border-sm" /> : <Download size={14} />}
        {label}
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      {open && (
        <div className="cf-dropdown" style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 100 }}>
          {EXPORT_TARGETS.map(({ key, label: itemLabel, icon: Icon, color }) => (
            <button
              key={key}
              className="cf-dropdown-item"
              onClick={() => { setOpen(false); onExport(key); }}
            >
              <Icon size={14} color={color} /> {itemLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}