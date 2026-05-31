/**
 * MODUL 10: SEITENÜBERSICHT (rechte Sidebar)
 * Thumbnail-Liste, Drag-and-Drop Sortierung, Auswahl für Export/Löschen
 */
import React, { useState } from 'react';

export default function PageOverview({ images, activeImageId, onSetActive, onReorder, onDeleteSelected, onExportSelected }) {
  const [selectionMode, setSelectionMode] = useState(false);

  const toggleAll = (val) => {
    // Alle selektieren/deselektieren via Callback
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.header}>
        <span>📋 Übersicht</span>
        <button
          style={{ ...styles.toggleBtn, ...(selectionMode ? styles.toggleBtnActive : {}) }}
          onClick={() => setSelectionMode(v => !v)}
        >
          ☑ Auswahl
        </button>
      </div>

      {selectionMode && (
        <div style={styles.actions}>
          <button style={styles.actionBtn} onClick={() => onExportSelected()}>📥 Export</button>
          <button style={{ ...styles.actionBtn, color: '#FF3B30', borderColor: '#FF3B30' }} onClick={() => onDeleteSelected()}>🗑️ Löschen</button>
        </div>
      )}

      <div>
        {images.length === 0
          ? <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', padding: '20px 0' }}>Keine Bilder</p>
          : images.map(img => (
            <ThumbnailItem
              key={img.id}
              img={img}
              isActive={img.id === activeImageId}
              selectionMode={selectionMode}
              onClick={() => onSetActive(img.id)}
            />
          ))
        }
      </div>
    </aside>
  );
}

function ThumbnailItem({ img, isActive, selectionMode, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        ...styles.thumb,
        ...(isActive ? styles.thumbActive : {}),
        ...(img.selected && selectionMode ? styles.thumbSelected : {}),
      }}
    >
      <div style={styles.thumbContent}>
        <img src={img.imageDataUrl} alt="" style={styles.thumbImg} draggable={false}/>
        <div style={styles.thumbInfo}>
          <span style={{ ...styles.thumbNum, ...(img.showPageNumber ? {} : { background: '#bbb' }) }}>
            {img.autoNumber}
          </span>
          <span style={styles.thumbName}>{img.name.length > 14 ? img.name.substring(0, 13) + '…' : img.name}</span>
        </div>
        <div style={{ fontSize: 8, color: '#aaa', marginTop: 1 }}>{img.elements.length} Elemente</div>
      </div>
    </div>
  );
}

const styles = {
  sidebar: { width: 188, background: 'white', borderLeft: '1px solid #e8e8ea', overflowY: 'auto', padding: '12px 9px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 },
  header: { fontWeight: 700, fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.6px', paddingBottom: 6, borderBottom: '1px solid #f0f0f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', whiteSpace: 'nowrap' },
  toggleBtn: { fontSize: 9, padding: '3px 7px', minHeight: 22, borderRadius: 6, background: '#f0f2f5', color: '#555', border: '1px solid #ddd', cursor: 'pointer', fontWeight: 600 },
  toggleBtnActive: { background: '#EFF6FF', color: '#007AFF', borderColor: '#007AFF' },
  actions: { display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 8, borderBottom: '1px solid #f0f0f2' },
  actionBtn: { padding: '6px 8px', fontSize: 10, background: 'white', border: '1.5px solid #e8e8ea', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
  thumb: { display: 'flex', alignItems: 'flex-start', gap: 5, padding: 6, background: '#f8f8fa', borderRadius: 8, cursor: 'pointer', border: '2px solid transparent', marginBottom: 5 },
  thumbActive: { borderColor: '#007AFF' },
  thumbSelected: { background: '#EDF5FF', borderColor: 'rgba(0,122,255,0.27)' },
  thumbContent: { flex: 1, minWidth: 0 },
  thumbImg: { width: '100%', height: 58, objectFit: 'cover', borderRadius: 4, marginBottom: 3, background: '#ddd', display: 'block', pointerEvents: 'none' },
  thumbInfo: { fontSize: 9, color: '#555', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 },
  thumbNum: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#007AFF', color: 'white', width: 15, height: 15, borderRadius: '50%', fontSize: 8, fontWeight: 800, flexShrink: 0 },
  thumbName: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
};
