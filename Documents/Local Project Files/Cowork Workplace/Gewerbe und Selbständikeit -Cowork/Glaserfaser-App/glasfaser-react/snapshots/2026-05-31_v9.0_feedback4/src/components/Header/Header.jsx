/**
 * MODUL 2: HTML-LAYOUT — Header (v8.0)
 * F3-09: Refresh-Button für Seitennummern
 */
import React, { useRef } from 'react';

export default function Header({ address, onAddressChange, onUpload, onExportZip, onClearAll, onRefreshPageNumbers }) {
  const fileInputRef = useRef(null);

  return (
    <header style={styles.header}>
      <div style={styles.title}>
        <span style={{ fontSize: 19 }}>🌐</span>
        <span>Glasfaser v9.0</span>
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
        <button style={styles.btnGhost} onClick={onRefreshPageNumbers} title="Seitennummern aktualisieren">🔄</button>
        <button style={styles.btnPrimary} onClick={() => fileInputRef.current?.click()}>📸 Hochladen</button>
        <button style={styles.btnSuccess} onClick={onExportZip}>📥 ZIP</button>
        <button style={styles.btnDanger} onClick={onClearAll}>🗑️</button>
      </div>
    </header>
  );
}

const btnBase = { padding:'7px 13px', minHeight:36, borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer', border:'1.5px solid transparent' };
const styles = {
  header: { background:'white', padding:'10px 14px', boxShadow:'0 1px 8px rgba(0,0,0,0.09)', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', zIndex:100, minHeight:54 },
  title: { fontSize:16, fontWeight:700, color:'#1a1a1a', display:'flex', alignItems:'center', gap:6 },
  addressWrap: { flex:1, minWidth:140, maxWidth:280 },
  addressInput: { width:'100%', padding:'7px 11px', border:'1.5px solid #e5e5e7', borderRadius:8, fontSize:13, fontFamily:'inherit', outline:'none', color:'#1a1a1a', background:'#f9f9f9' },
  actions: { display:'flex', gap:6, alignItems:'center', marginLeft:'auto' },
  btnGhost:   { ...btnBase, background:'white', borderColor:'#e8e8ea', color:'#555' },
  btnPrimary: { ...btnBase, background:'#007AFF', borderColor:'#007AFF', color:'white' },
  btnSuccess: { ...btnBase, background:'#34C759', borderColor:'#34C759', color:'white' },
  btnDanger:  { ...btnBase, background:'white', borderColor:'rgba(255,59,48,0.33)', color:'#FF3B30' },
};
