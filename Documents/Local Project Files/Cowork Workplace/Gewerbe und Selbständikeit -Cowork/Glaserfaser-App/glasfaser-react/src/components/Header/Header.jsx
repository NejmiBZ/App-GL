/**
 * MODUL 2: HTML-LAYOUT — Header
 * Adressfeld + Aktions-Buttons (Upload, ZIP-Export, Alles löschen)
 */
import React, { useRef } from 'react';

export default function Header({ address, onAddressChange, onUpload, onExportZip, onClearAll }) {
  const fileInputRef = useRef(null);

  return (
    <header style={styles.header}>
      <div style={styles.title}>
        <span style={{ fontSize: 19 }}>🌐</span>
        <span>Glasfaser v7.0</span>
      </div>

      <div style={styles.addressWrap}>
        <input
          type="text"
          placeholder="📍 Anschrift (optional)"
          value={address}
          onChange={e => onAddressChange(e.target.value)}
          style={styles.addressInput}
          autoComplete="off"
        />
      </div>

      <div style={styles.actions}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/json"
          style={{ display: 'none' }}
          onChange={e => { onUpload(e.target.files); e.target.value = ''; }}
        />
        <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
          📸 Hochladen
        </button>
        <button className="btn btn-success" onClick={onExportZip}>
          📥 ZIP
        </button>
        <button className="btn btn-danger" onClick={onClearAll}>
          🗑️
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    background: 'white', padding: '10px 14px',
    boxShadow: '0 1px 8px rgba(0,0,0,0.09)',
    display: 'flex', alignItems: 'center', gap: 10,
    flexWrap: 'wrap', zIndex: 100, minHeight: 54,
  },
  title: { fontSize: 16, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6 },
  addressWrap: { flex: 1, minWidth: 140, maxWidth: 280 },
  addressInput: {
    width: '100%', padding: '7px 11px', border: '1.5px solid #e5e5e7',
    borderRadius: 8, fontSize: 13, fontFamily: 'inherit', outline: 'none',
    color: '#1a1a1a', background: '#f9f9f9',
  },
  actions: { display: 'flex', gap: 6, alignItems: 'center', marginLeft: 'auto' },
};
