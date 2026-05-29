/**
 * Glasfaser Hausbegehung App — React v7.0
 * Root-Komponente: verbindet alle Module.
 *
 * Architektur:
 *  - useImages()  → Modul 10: Bild-Verwaltung
 *  - useDrawing() → Modul 8: Zickzack/Polyline
 *  - <Header>     → Modul 2: Layout
 *  - <Toolbar>    → Modul 2: Layout + Modul 13: Gebäude-Labels
 *  - <ImageCanvas>→ Modul 5+6: Rendering + Touch/Events
 *  - <PageOverview>→ Modul 10: Seitenübersicht
 */
import React, { useState, useCallback } from 'react';
import Header from './components/Header/Header';
import Toolbar from './components/Toolbar/Toolbar';
import ImageCanvas from './components/Canvas/ImageCanvas';
import PageOverview from './components/Sidebar/PageOverview';
import { useImages } from './hooks/useImages';
import { useDrawing } from './hooks/useDrawing';
import { createElement } from './utils/createElement';
import { COLORS } from './constants';

export default function App() {
  const [address, setAddress] = useState('');
  const [selectToolActive, setSelectToolActive] = useState(false);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const [activeBuildingGroupId, setActiveBuildingGroupId] = useState(null);

  const {
    images, setImages,
    activeImageId, setActiveId,
    uploadImages,
    deleteImage, updateImage,
    pushHistory, undoLast,
    clearAll,
  } = useImages();

  const {
    pencilMode,
    startPencilDraw,
    addPencilPoint,
    undoPencilPoint,
    updatePencilPreview,
    cancelDrawing,
    finishDrawing: finishPencilMode,
  } = useDrawing();

  // Pencil fertigstellen → Polyline-Element erstellen
  const finishDrawing = useCallback(() => {
    if (!pencilMode || pencilMode.points.length < 2) { cancelDrawing(); return; }
    const img = images.find(i => i.id === pencilMode.imageId);
    if (img) {
      const color = pencilMode.color === 'blue' ? COLORS.BLUE : COLORS.PURPLE;
      const lineWidth = Math.max(4, img.image.width / 350);
      updateImage(img.id, im => ({
        ...im,
        elements: [...im.elements, { type:'polyline', points:[...pencilMode.points], color, lineWidth }]
      }));
    }
    cancelDrawing();
  }, [pencilMode, images, updateImage, cancelDrawing]);

  // Element aus Toolbar hinzufügen
  const addElement = useCallback((type) => {
    if (pencilMode) cancelDrawing();
    setSelectToolActive(false);
    const imgId = activeImageId || (images.length > 0 ? images[0].id : null);
    if (!imgId) return;
    const img = images.find(i => i.id === imgId);
    if (!img) return;
    const elem = createElement(type, img.image.width, img.image.height);
    if (!elem) return;
    pushHistory(imgId);
    updateImage(imgId, im => ({ ...im, elements: [...im.elements, elem] }));
  }, [pencilMode, cancelDrawing, activeImageId, images, pushHistory, updateImage]);

  // Zickzack starten
  const handleStartPencil = useCallback((color) => {
    if (pencilMode) cancelDrawing(); // Vorherigen Modus + Button deaktivieren
    setSelectToolActive(false);
    const imgId = activeImageId || (images.length > 0 ? images[0].id : null);
    if (!imgId) return;
    startPencilDraw(color, imgId);
  }, [pencilMode, cancelDrawing, activeImageId, images, startPencilDraw]);

  // Toggle Auswahl-Werkzeug
  const toggleSelectTool = useCallback(() => {
    if (pencilMode) cancelDrawing();
    setSelectToolActive(v => !v);
  }, [pencilMode, cancelDrawing]);

  // Eigenen Text hinzufügen
  const addCustomText = useCallback(() => {
    if (!customText.trim()) return;
    const imgId = activeImageId || (images.length > 0 ? images[0].id : null);
    if (!imgId) return;
    const img = images.find(i => i.id === imgId);
    if (!img) return;
    const fontSize = Math.max(22, img.image.width / 50);
    pushHistory(imgId);
    updateImage(imgId, im => ({
      ...im,
      elements: [...im.elements, {
        type: 'text', text: customText.trim(),
        x: Math.round(img.image.width / 2 - 60),
        y: Math.round(img.image.height / 2 - fontSize / 2),
        color: COLORS.ORANGE, fontSize,
      }]
    }));
    setCustomText(''); setTextModalOpen(false);
  }, [customText, activeImageId, images, pushHistory, updateImage]);

  // Gebäude-Labels einfügen
  const insertBuildingLabels = useCallback((floors, aptsPerFloor) => {
    const imgId = activeImageId || (images.length > 0 ? images[0].id : null);
    if (!imgId) return;
    const img = images.find(i => i.id === imgId);
    if (!img) return;

    const groupId = 'bg_' + Date.now();
    const fontSize = Math.max(18, img.image.width / 60);
    const cx = img.image.width / 2, cy = img.image.height / 2;
    const hGap = Math.round(fontSize * 3.5);
    const vGap = Math.round(fontSize * 1.8);

    const rows = [{ type:'keller' }];
    rows.push({ type:'eg' });
    for (let f = 1; f <= floors; f++) rows.push({ prefix: String(f).padStart(2,'0'), type:'og' });

    const newLabels = [];
    const totalRows = rows.length, totalCols = aptsPerFloor;
    const startX = Math.round(cx - (totalCols - 1) * hGap / 2);
    const startY = Math.round(cy - (totalRows - 1) * vGap / 2);

    rows.forEach((row, rowIdx) => {
      const y = startY + (totalRows - 1 - rowIdx) * vGap;
      for (let col = 0; col < aptsPerFloor; col++) {
        let label;
        if (row.type === 'keller') label = '99S' + (col + 1);
        else if (row.type === 'eg') label = '00' + String(col + 1).padStart(2, '0');
        else label = row.prefix + String(col + 1).padStart(2, '0');
        newLabels.push({
          type: 'text', text: label,
          x: Math.round(startX + col * hGap), y: Math.round(y),
          color: COLORS.ORANGE, fontSize,
          isBuilding: true, buildingGroupId: groupId, buildingLocked: false,
        });
      }
    });

    pushHistory(imgId);
    // Vorherige Gruppe entfernen
    updateImage(imgId, im => ({
      ...im,
      elements: [
        ...im.elements.filter(e => e.buildingGroupId !== activeBuildingGroupId),
        ...newLabels
      ]
    }));
    setActiveBuildingGroupId(groupId);
  }, [activeImageId, images, pushHistory, updateImage, activeBuildingGroupId]);

  // Gruppenabstand anpassen
  const adjustBuildingSpacing = useCallback((axis, direction) => {
    if (!activeBuildingGroupId) return;
    const imgId = activeImageId;
    if (!imgId) return;
    const img = images.find(i => i.id === imgId);
    if (!img) return;
    const group = img.elements.filter(e => e.buildingGroupId === activeBuildingGroupId);
    if (!group.length) return;
    const xs = group.map(e => e.x), ys = group.map(e => e.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const step = Math.max(8, group[0].fontSize * 0.3);
    updateImage(imgId, im => ({
      ...im,
      elements: im.elements.map(e => {
        if (e.buildingGroupId !== activeBuildingGroupId) return e;
        if (axis === 'h') {
          const ox = e.x - cx;
          return { ...e, x: Math.round(cx + ox + direction * step * Math.sign(ox || 0.001)) };
        } else {
          const oy = e.y - cy;
          return { ...e, y: Math.round(cy + oy + direction * step * Math.sign(oy || 0.001)) };
        }
      })
    }));
  }, [activeBuildingGroupId, activeImageId, images, updateImage]);

  // Gruppe sperren
  const finalizeBuildingLabels = useCallback(() => {
    if (!activeBuildingGroupId) return;
    updateImage(activeImageId, im => ({
      ...im,
      elements: im.elements.map(e =>
        e.buildingGroupId === activeBuildingGroupId
          ? { ...e, buildingLocked: true, buildingGroupId: undefined }
          : e
      )
    }));
    setActiveBuildingGroupId(null);
  }, [activeBuildingGroupId, activeImageId, updateImage]);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', fontFamily:'-apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif', background:'#f0f2f5' }}>
      <Header
        address={address}
        onAddressChange={setAddress}
        onUpload={uploadImages}
        onExportZip={() => {/* TODO: useExport */}}
        onClearAll={() => { if (window.confirm('Alle Bilder löschen?')) clearAll(); }}
      />

      {/* Drawing Banner */}
      {pencilMode && (
        <div style={bannerStyle}>
          <span>✏️ {pencilMode.points.length} Punkt{pencilMode.points.length !== 1 ? 'e' : ''}</span>
          <button style={bannerBtn} onClick={undoPencilPoint}>↶ Punkt</button>
          <button style={bannerBtn} onClick={finishDrawing}>✓ Fertig</button>
          <button style={bannerBtn} onClick={cancelDrawing}>✕</button>
        </div>
      )}

      <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>
        <Toolbar
          selectToolActive={selectToolActive}
          onToggleSelectTool={toggleSelectTool}
          onAddElement={addElement}
          onStartPencil={handleStartPencil}
          pencilMode={pencilMode}
          onOpenTextModal={() => setTextModalOpen(true)}
          onInsertBuildingLabels={insertBuildingLabels}
          onAdjustBuildingSpacing={adjustBuildingSpacing}
          onFinalizeBuildingLabels={finalizeBuildingLabels}
          activeBuildingGroupId={activeBuildingGroupId}
        />

        <main style={{ flex:1, overflowY:'auto', padding:14, background:'#f0f2f5', minWidth:0 }}>
          {images.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 20px', textAlign:'center', color:'#999' }}>
              <div style={{ fontSize:54, marginBottom:14, opacity:0.35 }}>📸</div>
              <h2 style={{ fontSize:20, marginBottom:8, color:'#1a1a1a' }}>Keine Bilder hochgeladen</h2>
              <p style={{ fontSize:14, marginBottom:20 }}>Klicke auf "📸 Hochladen" um Bilder zu laden.</p>
            </div>
          ) : images.map(img => (
            <ImageCanvas
              key={img.id}
              imageData={img}
              isActive={img.id === activeImageId}
              onSetActive={setActiveId}
              selectToolActive={selectToolActive}
              pencilMode={pencilMode}
              onAddPencilPoint={addPencilPoint}
              onUpdatePencilPreview={updatePencilPreview}
              onFinishDrawing={finishDrawing}
              onCancelDrawing={cancelDrawing}
              onUpdateImage={updateImage}
              onPushHistory={pushHistory}
              onUndo={undoLast}
              onDelete={deleteImage}
            />
          ))}
        </main>

        <PageOverview
          images={images}
          activeImageId={activeImageId}
          onSetActive={setActiveId}
          onReorder={() => {}}
          onDeleteSelected={() => {}}
          onExportSelected={() => {}}
        />
      </div>

      {/* Text Modal */}
      {textModalOpen && (
        <div style={modalOverlay} onClick={() => setTextModalOpen(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom:14, color:'#1a1a1a', fontSize:15 }}>📝 Eigenen Text eingeben</h3>
            <input
              autoFocus
              type="text"
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              onKeyDown={e => { if (e.key==='Enter') addCustomText(); if (e.key==='Escape') setTextModalOpen(false); }}
              placeholder="Text eingeben…"
              style={{ width:'100%', padding:11, border:'2px solid #e5e5e7', borderRadius:8, fontSize:16, marginBottom:14, fontFamily:'inherit', outline:'none' }}
            />
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setTextModalOpen(false)}>Abbrechen</button>
              <button className="btn btn-primary" onClick={addCustomText}>Hinzufügen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const bannerStyle = {
  position:'fixed', top:62, left:'50%', transform:'translateX(-50%)',
  background:'linear-gradient(135deg,#007AFF,#0055CC)', color:'white',
  padding:'9px 16px', borderRadius:10, display:'flex', alignItems:'center', gap:8,
  zIndex:800, whiteSpace:'nowrap', fontSize:13, fontWeight:600,
  boxShadow:'0 4px 20px rgba(0,122,255,0.4)',
};
const bannerBtn = { background:'rgba(255,255,255,0.18)', color:'white', padding:'5px 11px', borderRadius:7, fontSize:12, fontWeight:700, border:'1px solid rgba(255,255,255,0.25)', cursor:'pointer' };
const modalOverlay = { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 };
const modalBox = { background:'white', borderRadius:16, padding:20, minWidth:300, maxWidth:'90vw', boxShadow:'0 16px 48px rgba(0,0,0,0.18)' };
