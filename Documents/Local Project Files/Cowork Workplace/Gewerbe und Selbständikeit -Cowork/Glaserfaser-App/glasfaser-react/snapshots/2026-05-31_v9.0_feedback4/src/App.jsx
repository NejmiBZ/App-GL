/**
 * Glasfaser Hausbegehung App — React v9.0
 *
 * F3-01: Gebäude-Labels Nullpunkt-System
 * F3-02: Keller immer 2 Labels (99S1, 99S2)
 * F3-03: Lasso Freihand-Mehrfachauswahl
 * F3-04: Pfad-basierter Radierer (in ImageCanvas)
 * F3-05: Pen-only Canvas + Auto-Select nach Einfügen (in ImageCanvas)
 * F3-06: Handle-Radius 18px (in CONFIG + ImageCanvas)
 * F3-07: GFTA 50px (in createElement)
 * F3-08: Copy-Button (in ImageCanvas)
 * F3-09: Refresh Seitennummern
 * F3-10: Beschriftungen kleinere Schrift (in Toolbar)
 * F3-11: Zickzack auto-finish bei Tool-Wechsel
 */
import React, { useState, useCallback, useRef } from 'react';
import Header from './components/Header/Header';
import Toolbar from './components/Toolbar/Toolbar';
import ImageCanvas from './components/Canvas/ImageCanvas';
import PageOverview from './components/Sidebar/PageOverview';
import { useImages } from './hooks/useImages';
import { useDrawing } from './hooks/useDrawing';
import { createElement } from './utils/createElement';
import { getElementCenter, isPointInPolygon } from './utils/hitDetection';
import { COLORS } from './constants';

export default function App() {
  const [address, setAddress]             = useState('');
  const [selectToolActive, setSelectToolActive] = useState(false);
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [customText, setCustomText]       = useState('');
  const [activeBuildingGroupId, setActiveBuildingGroupId] = useState(null);
  const buildingGroupDataRef = useRef({}); // {groupId: {nullX,nullY,hGap,vGap,floors,aptsPerFloor,fontSize}}

  // F3-03: Lasso-State
  const [lassoMode, setLassoMode]         = useState(false);
  const [lassoPath, setLassoPath]         = useState([]);     // [{x,y},...] aktueller Pfad
  const [lassoImageId, setLassoImageId]   = useState(null);
  const [selectedGroup, setSelectedGroup] = useState([]);     // [{imageId,index},...]
  const [isGroupDragging, setIsGroupDragging] = useState(false);
  const [groupDragStart, setGroupDragStart]   = useState(null);
  const [groupDragImageId, setGroupDragImageId] = useState(null);
  const [minusTapMode, setMinusTapMode]   = useState(false);
  const [showGroupOverlay, setShowGroupOverlay] = useState(false);

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
  } = useDrawing();

  // F3-11: Zickzack auto-finish (≥2 Punkte → speichern, sonst verwerfen)
  const finishOrCancelPencil = useCallback(() => {
    if (!pencilMode) return;
    if (pencilMode.points.length >= 2) {
      finishDrawing();
    } else {
      cancelDrawing();
    }
  }, [pencilMode, cancelDrawing]);

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

  // Element aus Toolbar hinzufügen (F3-11: finishOrCancel, F3-05: auto-select in Canvas)
  const addElement = useCallback((type) => {
    finishOrCancelPencil();
    setSelectToolActive(false);
    if (lassoMode) { setLassoMode(false); setLassoPath([]); setSelectedGroup([]); setShowGroupOverlay(false); }
    const imgId = activeImageId || (images.length > 0 ? images[0].id : null);
    if (!imgId) return;
    const img = images.find(i => i.id === imgId);
    if (!img) return;
    const elem = createElement(type, img.image.width, img.image.height);
    if (!elem) return;
    pushHistory(imgId);
    updateImage(imgId, im => ({ ...im, elements: [...im.elements, elem] }));
  }, [finishOrCancelPencil, lassoMode, activeImageId, images, pushHistory, updateImage]);

  // Zickzack starten (F3-11)
  const handleStartPencil = useCallback((color) => {
    finishOrCancelPencil();
    setSelectToolActive(false);
    setLassoMode(false);
    const imgId = activeImageId || (images.length > 0 ? images[0].id : null);
    if (!imgId) return;
    startPencilDraw(color, imgId);
  }, [finishOrCancelPencil, activeImageId, images, startPencilDraw]);

  // Auswahl-Tool (F3-11)
  const toggleSelectTool = useCallback(() => {
    finishOrCancelPencil();
    setLassoMode(false); setLassoPath([]); setSelectedGroup([]); setShowGroupOverlay(false);
    setSelectToolActive(v => !v);
  }, [finishOrCancelPencil]);

  // F3-03: Lasso-Tool Toggle
  const toggleLassoMode = useCallback(() => {
    finishOrCancelPencil();
    setSelectToolActive(false);
    setLassoMode(v => {
      if (v) { setLassoPath([]); setSelectedGroup([]); setShowGroupOverlay(false); }
      return !v;
    });
  }, [finishOrCancelPencil]);

  // ── Lasso Callbacks ──────────────────────────────────────
  const handleLassoStart = useCallback((imageId, pos) => {
    setLassoImageId(imageId);
    setLassoPath([pos]);
    setSelectedGroup([]);
    setShowGroupOverlay(false);
  }, []);

  const handleLassoExtend = useCallback((pos) => {
    setLassoPath(prev => [...prev, pos]);
  }, []);

  const handleLassoFinish = useCallback((imageId, elements) => {
    setLassoPath(prev => {
      if (prev.length < 3) { return []; }
      const selected = [];
      elements.forEach((elem, idx) => {
        const center = getElementCenter(elem);
        if (center && isPointInPolygon(center, prev)) {
          selected.push({ imageId, index: idx });
        }
      });
      setSelectedGroup(selected);
      if (selected.length > 0) setShowGroupOverlay(true);
      return [];
    });
  }, []);

  const handleGroupDragStart = useCallback((imageId, pos) => {
    setIsGroupDragging(true);
    setGroupDragStart(pos);
    setGroupDragImageId(imageId);
    const img = images.find(i => i.id === imageId);
    if (img) pushHistory(imageId);
  }, [images, pushHistory]);

  const handleGroupDragMove = useCallback((imageId, pos) => {
    if (!groupDragStart) return;
    const dx = pos.x - groupDragStart.x;
    const dy = pos.y - groupDragStart.y;
    setGroupDragStart(pos);
    updateImage(imageId, im => {
      const elems = [...im.elements];
      selectedGroup.filter(s => s.imageId === imageId).forEach(s => {
        const e = { ...elems[s.index] };
        switch(e.type){
          case 'line':case 'line_circle':e.x1+=dx;e.y1+=dy;e.x2+=dx;e.y2+=dy;break;
          case 'polyline':if(e.points)e.points=[...e.points.map(p=>({x:p.x+dx,y:p.y+dy}))];break;
          case 'circle':e.x+=dx;e.y+=dy;break;
          case 'rect':e.x+=dx;e.y+=dy;break;
          case 'gfta':e.x1+=dx;e.y1+=dy;break;
          case 'text':e.x+=dx;e.y+=dy;break;
        }
        elems[s.index] = e;
      });
      return { ...im, elements: elems };
    });
  }, [groupDragStart, selectedGroup, updateImage]);

  const handleGroupDragEnd = useCallback(() => {
    setIsGroupDragging(false);
    setGroupDragStart(null);
    setGroupDragImageId(null);
  }, []);

  const handleRemoveFromGroup = useCallback((imageId, elemIndex) => {
    setSelectedGroup(prev => {
      const updated = prev.filter(s => !(s.imageId===imageId && s.index===elemIndex));
      if (updated.length === 0) { setShowGroupOverlay(false); setMinusTapMode(false); }
      return updated;
    });
  }, []);

  const handleDeleteGroup = useCallback(() => {
    if (selectedGroup.length === 0) return;
    const imgId = selectedGroup[0].imageId;
    pushHistory(imgId);
    updateImage(imgId, im => {
      const indices = selectedGroup.filter(s=>s.imageId===imgId).map(s=>s.index).sort((a,b)=>b-a);
      const elems = [...im.elements];
      indices.forEach(idx => elems.splice(idx, 1));
      return { ...im, elements: elems };
    });
    setSelectedGroup([]); setLassoPath([]); setShowGroupOverlay(false);
  }, [selectedGroup, pushHistory, updateImage]);

  const handleCopyGroup = useCallback(() => {
    if (selectedGroup.length === 0) return;
    const imgId = selectedGroup[0].imageId;
    const img = images.find(i => i.id === imgId);
    if (!img) return;
    pushHistory(imgId);
    const OFFSET = 35;
    updateImage(imgId, im => {
      const elems = [...im.elements];
      selectedGroup.filter(s=>s.imageId===imgId).forEach(s => {
        const copy = JSON.parse(JSON.stringify(elems[s.index]));
        switch(copy.type){
          case 'line':case 'line_circle':copy.x1+=OFFSET;copy.y1+=OFFSET;copy.x2+=OFFSET;copy.y2+=OFFSET;break;
          case 'polyline':if(copy.points)copy.points=copy.points.map(p=>({x:p.x+OFFSET,y:p.y+OFFSET}));break;
          case 'circle':case 'rect':case 'text':copy.x+=OFFSET;copy.y+=OFFSET;break;
          case 'gfta':copy.x1+=OFFSET;copy.y1+=OFFSET;break;
        }
        delete copy.isBuilding;delete copy.buildingGroupId;delete copy.buildingLocked;delete copy.isAutoNumber;
        elems.push(copy);
      });
      return { ...im, elements: elems };
    });
    setSelectedGroup([]); setLassoPath([]); setShowGroupOverlay(false);
  }, [selectedGroup, images, pushHistory, updateImage]);

  // F4-05: Polyline-Segment löschen
  const deletePolylineSegment = useCallback((imageId, elemIndex, segIndex) => {
    const img = images.find(i => i.id === imageId);
    if (!img) return;
    pushHistory(imageId);
    updateImage(imageId, im => {
      const elems = [...im.elements];
      const elem = elems[elemIndex];
      if (!elem || elem.type !== 'polyline') return im;
      const partA = elem.points.slice(0, segIndex + 1);
      const partB = elem.points.slice(segIndex + 1);
      elems.splice(elemIndex, 1);
      if (partA.length >= 2) elems.splice(elemIndex, 0, { ...elem, points: partA });
      if (partB.length >= 2) elems.push({ ...elem, points: partB });
      return { ...im, elements: elems };
    });
  }, [images, pushHistory, updateImage]);

  // F3-08: Copy einzelnes Element
  const copyElement = useCallback((imageId, elemIndex) => {
    const img = images.find(i => i.id === imageId);
    if (!img) return;
    const original = img.elements[elemIndex];
    if (!original) return;
    pushHistory(imageId);
    const copy = JSON.parse(JSON.stringify(original));
    const OFFSET = 30;
    switch(copy.type){
      case 'line':case 'line_circle':copy.x1+=OFFSET;copy.y1+=OFFSET;copy.x2+=OFFSET;copy.y2+=OFFSET;break;
      case 'polyline':if(copy.points)copy.points=copy.points.map(p=>({x:p.x+OFFSET,y:p.y+OFFSET}));break;
      case 'circle':case 'rect':case 'text':copy.x+=OFFSET;copy.y+=OFFSET;break;
      case 'gfta':copy.x1+=OFFSET;copy.y1+=OFFSET;break;
    }
    delete copy.isBuilding;delete copy.buildingGroupId;delete copy.buildingLocked;delete copy.isAutoNumber;
    updateImage(imageId, im => ({ ...im, elements: [...im.elements, copy] }));
  }, [images, pushHistory, updateImage]);

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
        type:'text', text:customText.trim(),
        x: Math.round(img.image.width/2 - 60),
        y: Math.round(img.image.height/2 - fontSize/2),
        color: COLORS.ORANGE, fontSize,
      }]
    }));
    setCustomText(''); setTextModalOpen(false);
  }, [customText, activeImageId, images, pushHistory, updateImage]);

  // F3-09: Seitennummern aktualisieren
  const refreshPageNumbers = useCallback(() => {
    setImages(prev => prev.map((img, idx) => {
      const autoNumber = idx + 1;
      const showPageNumber = autoNumber >= 4;
      const elements = img.elements.map(el => {
        if (!el.isAutoNumber) return el;
        return { ...el, text: String(autoNumber - 3) };
      });
      return { ...img, autoNumber, showPageNumber, elements };
    }));
  }, [setImages]);

  // F3-01 + F3-02: Gebäude-Labels einfügen (Nullpunkt-System, Keller=2)
  const insertBuildingLabels = useCallback((floors, aptsPerFloor) => {
    const imgId = activeImageId || (images.length > 0 ? images[0].id : null);
    if (!imgId) return;
    const img = images.find(i => i.id === imgId);
    if (!img) return;

    const groupId  = 'bg_' + Date.now();
    const fontSize = Math.max(18, img.image.width / 60);
    const cx = img.image.width / 2;
    const cy = img.image.height / 2;
    const hGap = Math.round(fontSize * 7.0); // F4-03: doppelt so weit
    const vGap = Math.round(fontSize * 3.6);

    // Nullpunkt = EG, Spalte 0
    const nullX = Math.round(cx - (aptsPerFloor - 1) * hGap / 2);
    const nullY = Math.round(cy);

    // Metadaten speichern für adjustBuildingSpacing
    buildingGroupDataRef.current[groupId] = { nullX, nullY, hGap, vGap, floors, aptsPerFloor, fontSize };

    const newLabels = [];

    // OG-Etagen (oben)
    for (let f = floors; f >= 1; f--) {
      for (let col = 0; col < aptsPerFloor; col++) {
        newLabels.push({
          type:'text', text: String(f).padStart(2,'0') + String(col+1).padStart(2,'0'),
          x: Math.round(nullX + col * hGap), y: Math.round(nullY - f * vGap),
          color: COLORS.ORANGE, fontSize,
          isBuilding:true, buildingGroupId:groupId, buildingLocked:false,
          buildingRow:'og', buildingFloor:f, buildingCol:col,
        });
      }
    }
    // EG
    for (let col = 0; col < aptsPerFloor; col++) {
      newLabels.push({
        type:'text', text: '00' + String(col+1).padStart(2,'0'),
        x: Math.round(nullX + col * hGap), y: nullY,
        color: COLORS.ORANGE, fontSize,
        isBuilding:true, buildingGroupId:groupId, buildingLocked:false,
        buildingRow:'eg', buildingFloor:0, buildingCol:col,
      });
    }
    // F3-02: Keller immer genau 2 Labels (99S1, 99S2)
    for (let col = 0; col < 2; col++) {
      newLabels.push({
        type:'text', text: '99S' + (col+1),
        x: Math.round(nullX + col * hGap), y: Math.round(nullY + vGap),
        color: COLORS.ORANGE, fontSize,
        isBuilding:true, buildingGroupId:groupId, buildingLocked:false,
        buildingRow:'keller', buildingFloor:0, buildingCol:col,
      });
    }

    pushHistory(imgId);
    updateImage(imgId, im => ({
      ...im,
      elements: [
        ...im.elements.filter(e => e.buildingGroupId !== activeBuildingGroupId),
        ...newLabels
      ]
    }));
    setActiveBuildingGroupId(groupId);
  }, [activeImageId, images, pushHistory, updateImage, activeBuildingGroupId]);

  // F3-01: Abstände anpassen (Nullpunkt-System)
  // F4-02: Delta auf aktuelle Positionen — individuelle Moves bleiben erhalten
  const adjustBuildingSpacing = useCallback((axis, direction, isLarge) => {
    if (!activeBuildingGroupId) return;
    const imgId = activeImageId || (images.length > 0 ? images[0].id : null);
    if (!imgId) return;
    const gd = buildingGroupDataRef.current[activeBuildingGroupId];
    if (!gd) return;
    const step = Math.round(gd.fontSize * (isLarge ? 1.2 : 0.3));
    const oldHGap = gd.hGap, oldVGap = gd.vGap;
    if (axis === 'h') {
      gd.hGap = Math.max(Math.round(gd.fontSize * 1.5), gd.hGap + direction * step);
    } else {
      gd.vGap = Math.max(Math.round(gd.fontSize * 1.0), gd.vGap + direction * step);
    }
    const deltaH = gd.hGap - oldHGap;
    const deltaV = gd.vGap - oldVGap;
    updateImage(imgId, im => ({
      ...im,
      elements: im.elements.map(e => {
        if (e.buildingGroupId !== activeBuildingGroupId) return e;
        const col = e.buildingCol || 0;
        if (axis === 'h' && col > 0) return { ...e, x: Math.round(e.x + col * deltaH) };
        if (axis === 'v' && e.buildingRow === 'og') return { ...e, y: Math.round(e.y - (e.buildingFloor||0) * deltaV) };
        return e;
      })
    }));
  }, [activeBuildingGroupId, activeImageId, updateImage]);

  // Gebäude-Gruppe sperren
  const finalizeBuildingLabels = useCallback(() => {
    if (!activeBuildingGroupId) return;
    updateImage(activeImageId, im => ({
      ...im,
      elements: im.elements.map(e =>
        e.buildingGroupId === activeBuildingGroupId
          ? { ...e, buildingLocked:true, buildingGroupId:undefined }
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
        onExportZip={() => {/* TODO */}}
        onClearAll={() => { if (window.confirm('Alle Bilder löschen?')) clearAll(); }}
        onRefreshPageNumbers={refreshPageNumbers}
      />

      {/* Drawing Banner */}
      {pencilMode && (
        <div style={bannerStyle}>
          <span>✏️ {pencilMode.points.length} Punkt{pencilMode.points.length!==1?'e':''}</span>
          <button style={bannerBtn} onClick={undoPencilPoint}>↶ Punkt</button>
          <button style={bannerBtn} onClick={finishDrawing}>✓ Fertig</button>
          <button style={bannerBtn} onClick={cancelDrawing}>✕</button>
        </div>
      )}

      {/* F3-03: Lasso Gruppen-Overlay */}
      {showGroupOverlay && selectedGroup.length > 0 && (
        <div style={groupOverlayStyle}>
          <span style={{ color:'white', fontSize:12, fontWeight:700 }}>
            {selectedGroup.length} Element{selectedGroup.length>1?'e':''}
          </span>
          <button style={groupBtn('#34C759')} onClick={handleCopyGroup}>⧉ Kopieren</button>
          <button style={groupBtn('#FF3B30')} onClick={handleDeleteGroup}>🗑️ Löschen</button>
          <button style={{ ...groupBtn('#FF9500'), ...(minusTapMode ? { opacity:1, outline:'2px solid white' } : {}) }}
                  onClick={() => setMinusTapMode(v => !v)}>− Entfernen</button>
          <button style={groupBtn('#8E8E93')}
                  onClick={() => { setSelectedGroup([]); setLassoPath([]); setShowGroupOverlay(false); setMinusTapMode(false); }}>
            ✕
          </button>
        </div>
      )}

      <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>
        <Toolbar
          selectToolActive={selectToolActive}
          onToggleSelectTool={toggleSelectTool}
          lassoMode={lassoMode}
          onToggleLassoMode={toggleLassoMode}
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
              pencilMode={pencilMode}
              onAddPencilPoint={addPencilPoint}
              onUpdatePencilPreview={updatePencilPreview}
              onFinishDrawing={finishDrawing}
              onCancelDrawing={cancelDrawing}
              onUpdateImage={updateImage}
              onPushHistory={pushHistory}
              onUndo={undoLast}
              onDelete={deleteImage}
              onCopyElement={copyElement}
              onDeletePolylineSegment={deletePolylineSegment}
              lassoMode={lassoMode}
              lassoPath={lassoPath}
              lassoImageId={lassoImageId}
              selectedGroup={selectedGroup}
              onLassoStart={handleLassoStart}
              onLassoExtend={handleLassoExtend}
              onLassoFinish={handleLassoFinish}
              onGroupDragStart={handleGroupDragStart}
              onGroupDragMove={handleGroupDragMove}
              onGroupDragEnd={handleGroupDragEnd}
              onRemoveFromGroup={handleRemoveFromGroup}
              isGroupDragging={isGroupDragging}
              groupDragImageId={groupDragImageId}
              minusTapMode={minusTapMode}
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
            <input autoFocus type="text" value={customText}
              onChange={e => setCustomText(e.target.value)}
              onKeyDown={e => { if(e.key==='Enter') addCustomText(); if(e.key==='Escape') setTextModalOpen(false); }}
              placeholder="Text eingeben…"
              style={{ width:'100%', padding:11, border:'2px solid #e5e5e7', borderRadius:8, fontSize:16, marginBottom:14, fontFamily:'inherit', outline:'none' }}
            />
            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button onClick={() => setTextModalOpen(false)} style={modalBtnSec}>Abbrechen</button>
              <button onClick={addCustomText} style={modalBtnPri}>Hinzufügen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const bannerStyle = { position:'fixed', top:62, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#007AFF,#0055CC)', color:'white', padding:'9px 16px', borderRadius:10, display:'flex', alignItems:'center', gap:8, zIndex:800, whiteSpace:'nowrap', fontSize:13, fontWeight:600, boxShadow:'0 4px 20px rgba(0,122,255,0.4)' };
const bannerBtn = { background:'rgba(255,255,255,0.18)', color:'white', padding:'5px 11px', borderRadius:7, fontSize:12, fontWeight:700, border:'1px solid rgba(255,255,255,0.25)', cursor:'pointer' };
const groupOverlayStyle = { position:'fixed', top:62, left:'50%', transform:'translateX(-50%)', background:'rgba(0,0,0,0.78)', padding:'8px 14px', borderRadius:20, display:'flex', alignItems:'center', gap:8, zIndex:750, flexWrap:'wrap', justifyContent:'center' };
const groupBtn = (bg) => ({ background:bg, color:'white', border:'none', borderRadius:12, padding:'6px 12px', fontSize:12, fontWeight:700, cursor:'pointer' });
const modalOverlay = { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:2000 };
const modalBox = { background:'white', borderRadius:16, padding:20, minWidth:300, maxWidth:'90vw', boxShadow:'0 16px 48px rgba(0,0,0,0.18)' };
const modalBtnBase = { padding:'9px 18px', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer', border:'none' };
const modalBtnSec = { ...modalBtnBase, background:'#f0f0f2', color:'#555' };
const modalBtnPri = { ...modalBtnBase, background:'#007AFF', color:'white' };
