/**
 * MODUL 5 + 6: CANVAS-RENDERING + TOUCH/PENCIL-EVENTS (v8.0)
 *
 * F3-04: Pfad-basierter Radierer (drag to erase)
 * F3-05: Pen-only für Nicht-Text-Elemente auf Canvas
 * F3-06: Handle-Radius 18px
 * F3-08: Copy-Button neben Delete-Button
 * F3-03: Lasso-Overlay zeichnen + Gruppen hervorheben
 *
 * Interaktionsregeln (FINAL):
 *  - Toolbar: Finger + Pen
 *  - Canvas Nicht-Text-Elemente: nur Pen (pointerType === 'pen')
 *  - Canvas Text-Elemente: Finger + Pen
 *  - Pinch-Zoom: zwei Finger (unverändert)
 */
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle, Rect, Text, Group } from 'react-konva';
import { CONFIG, COLORS } from '../../constants';
import { getElementAtPoint, getElementCenter, isPointInPolygon } from '../../utils/hitDetection';
import { findSnapPoint, getAlignmentSnap } from '../../utils/snapUtils';

export default function ImageCanvas({
  imageData,
  isActive,
  onSetActive,
  pencilMode,
  onAddPencilPoint,
  onUpdatePencilPreview,
  onFinishDrawing,
  onCancelDrawing,
  onUpdateImage,
  onPushHistory,
  onUndo,
  onDelete,
  onCopyElement,
  onDeletePolylineSegment,
  // Lasso (F3-03)
  lassoMode,
  lassoPath,
  lassoImageId,
  selectedGroup,
  onLassoStart,
  onLassoExtend,
  onLassoFinish,
  onGroupDragStart,
  onGroupDragMove,
  onGroupDragEnd,
  onRemoveFromGroup,
  isGroupDragging,
  groupDragImageId,
  minusTapMode,
}) {
  const [zoom, setZoom]           = useState(CONFIG.DEFAULT_ZOOM);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [isDragging, setIsDragging]   = useState(false);
  const [dragStart, setDragStart]     = useState(null);
  const [resizePart, setResizePart]   = useState(null);
  const [eraserActive, setEraserActive] = useState(false); // lokal für Pfad-Radierer
  const [eraserHistoryPushed, setEraserHistoryPushed] = useState(false);
  const stageRef   = useRef(null);
  const containerRef = useRef(null);

  // Overlay-Button-Position (F3-08)
  const [overlayPos, setOverlayPos] = useState(null); // {x, y} in screen px
  const [overlayElemIdx, setOverlayElemIdx] = useState(-1);

  const MAX_W  = CONFIG.MAX_DISPLAY_WIDTH;
  const aspect = imageData.image.height / imageData.image.width;
  const baseW  = Math.min(MAX_W, imageData.image.width);
  const dispW  = baseW * zoom;
  const dispH  = dispW * aspect;
  const scaleX = dispW / imageData.image.width;
  const scaleY = dispH / imageData.image.height;

  const toCanvas = useCallback((e) => {
    const stage = stageRef.current;
    if (!stage) return { x:0, y:0 };
    const pos = stage.getPointerPosition();
    return { x: pos.x / scaleX, y: pos.y / scaleY };
  }, [scaleX, scaleY]);

  // Overlay-Position berechnen (canvas-coords → screen-coords)
  const calcOverlayPos = useCallback((elem) => {
    if (!elem || !containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    let cx, cy;
    switch(elem.type) {
      case 'line': case 'line_circle': cx=(elem.x1+elem.x2)/2; cy=Math.min(elem.y1,elem.y2); break;
      case 'polyline': if(elem.points&&elem.points.length>0){cx=elem.points[0].x;cy=elem.points[0].y;} else return null; break;
      case 'circle':   cx=elem.x; cy=elem.y-elem.radius; break;
      case 'rect':     cx=elem.x+elem.width/2; cy=elem.y; break;
      case 'gfta':     cx=elem.x1+elem.width/2; cy=elem.y1; break;
      case 'text':     cx=elem.x; cy=elem.y; break;
      default: return null;
    }
    return {
      x: rect.left + cx * scaleX,
      y: rect.top  + cy * scaleY - 44,
    };
  }, [scaleX, scaleY]);

  const showOverlay = useCallback((idx) => {
    const elem = imageData.elements[idx];
    if (!elem) return;
    setOverlayElemIdx(idx);
    setOverlayPos(calcOverlayPos(elem));
  }, [imageData.elements, calcOverlayPos]);

  const hideOverlay = useCallback(() => {
    setOverlayPos(null);
    setOverlayElemIdx(-1);
  }, []);

  // ── Pointer Down ──────────────────────────────────────────
  const handlePointerDown = useCallback((e) => {
    const nativeEvt = e.evt;
    const pointerType = nativeEvt?.pointerType || 'pen';

    onSetActive(imageData.id);
    const pos = toCanvas(e);

    // Pinch-Zoom: wird von Konva intern gehandelt — hier ignorieren bei multi-touch
    if (nativeEvt?.isPrimary === false) return;

    // PENCIL-MODUS
    if (pencilMode && pencilMode.imageId === imageData.id) {
      const snap = findSnapPoint(imageData.elements, pos.x, pos.y, -1);
      let pt = snap || pos;
      if (pencilMode.points.length > 0 && !snap) {
        const last = pencilMode.points[pencilMode.points.length - 1];
        const aligned = getAlignmentSnap(last.x, last.y, pos.x, pos.y);
        pt = { x: aligned.x, y: aligned.y };
      }
      onAddPencilPoint(pt);
      return;
    }

    // LASSO-MODUS (F3-03) — nur Pen
    if (lassoMode && pointerType === 'pen') {
      const hit = getElementAtPoint(imageData.elements, pos.x, pos.y);
      // Minus-Modus: Element aus Gruppe entfernen
      if (minusTapMode && hit) {
        onRemoveFromGroup(imageData.id, hit.index);
        return;
      }
      const hitSelected = hit && selectedGroup.some(s => s.imageId===imageData.id && s.index===hit.index);
      if (hitSelected && selectedGroup.length > 0) {
        onGroupDragStart(imageData.id, pos);
        setIsDragging(true);
      } else {
        onLassoStart(imageData.id, pos);
        setIsDragging(true);
      }
      return;
    }

    // RADIERER-MODUS (F3-04: Pfad-basiert)
    if (imageData.eraserMode) {
      setIsDragging(true);
      setEraserActive(true);
      setEraserHistoryPushed(false);
      const hit = getElementAtPoint(imageData.elements, pos.x, pos.y);
      if (hit) {
        onPushHistory(imageData.id);
        setEraserHistoryPushed(true);
        onUpdateImage(imageData.id, im => {
          const elems = [...im.elements];
          elems.splice(hit.index, 1);
          return { ...im, elements: elems };
        });
        if (selectedIdx === hit.index) { setSelectedIdx(-1); hideOverlay(); }
      }
      return;
    }

    // ELEMENT AUSWÄHLEN
    const hit = getElementAtPoint(imageData.elements, pos.x, pos.y);
    if (hit) {
      const elem = imageData.elements[hit.index];
      const isText = elem?.type === 'text';
      // F3-05: Nicht-Text nur mit Pen
      if (!isText && pointerType !== 'pen') {
        setSelectedIdx(-1); hideOverlay(); return;
      }
      // F4-05: Segment-Löschen
      if (hit.part && hit.part.startsWith('segdel_')) {
        const segIdx = parseInt(hit.part.split('_')[1]);
        if (onDeletePolylineSegment) onDeletePolylineSegment(imageData.id, hit.index, segIdx);
        return;
      }
      onPushHistory(imageData.id);
      setSelectedIdx(hit.index);
      setIsDragging(true);
      setDragStart(pos);
      setResizePart(['start','end','resize'].includes(hit.part) || hit.part?.startsWith('point_') ? hit.part : null);
      showOverlay(hit.index);
    } else {
      setSelectedIdx(-1);
      hideOverlay();
      setIsDragging(false);
    }
  }, [imageData, pencilMode, lassoMode, selectedGroup, minusTapMode, toCanvas,
      onAddPencilPoint, onPushHistory, onSetActive, onUpdateImage,
      onLassoStart, onGroupDragStart, onRemoveFromGroup,
      selectedIdx, showOverlay, hideOverlay]);

  // ── Pointer Move ─────────────────────────────────────────
  const handlePointerMove = useCallback((e) => {
    const nativeEvt = e.evt;
    const pointerType = nativeEvt?.pointerType || 'pen';
    const pos = toCanvas(e);

    if (pencilMode && pencilMode.imageId === imageData.id) {
      onUpdatePencilPreview(pos);
      return;
    }

    // LASSO BEWEGEN (F3-03)
    if (lassoMode && pointerType === 'pen' && isDragging) {
      if (isGroupDragging && groupDragImageId === imageData.id) {
        onGroupDragMove(imageData.id, pos);
      } else if (lassoImageId === imageData.id) {
        onLassoExtend(pos);
      }
      return;
    }

    // RADIERER PFAD (F3-04)
    if (imageData.eraserMode && eraserActive && isDragging) {
      const hit = getElementAtPoint(imageData.elements, pos.x, pos.y);
      if (hit) {
        if (!eraserHistoryPushed) {
          onPushHistory(imageData.id);
          setEraserHistoryPushed(true);
        }
        onUpdateImage(imageData.id, im => {
          const elems = [...im.elements];
          elems.splice(hit.index, 1);
          return { ...im, elements: elems };
        });
        if (selectedIdx >= hit.index) { setSelectedIdx(-1); hideOverlay(); }
      }
      return;
    }

    // ELEMENT BEWEGEN / RESIZE
    if (!isDragging || selectedIdx < 0) return;
    const elements = [...imageData.elements];
    const elem = { ...elements[selectedIdx] };
    if (resizePart === 'start') { elem.x1 = pos.x; elem.y1 = pos.y; }
    else if (resizePart === 'end') { elem.x2 = pos.x; elem.y2 = pos.y; }
    else if (resizePart === 'resize') {
      if (elem.type==='circle') elem.radius = Math.max(10, Math.hypot(pos.x-elem.x, pos.y-elem.y));
      else if (elem.type==='rect') { elem.width=Math.max(20,pos.x-elem.x); elem.height=Math.max(20,pos.y-elem.y); }
      else if (elem.type==='gfta') {
        const rot=elem.rotation||0;
        if(rot===0){const tw=Math.max(40,pos.x-elem.x1);elem.width=(tw-elem.spacing)/2;elem.height=Math.max(15,pos.y-elem.y1);}
        else{elem.width=Math.max(15,pos.x-elem.x1);const th=Math.max(40,pos.y-elem.y1);elem.height=(th-elem.spacing)/2;}
      }
    } else if (resizePart?.startsWith('point_')) {
      const pIdx = parseInt(resizePart.split('_')[1]);
      if (elem.points?.[pIdx]) { elem.points = [...elem.points]; elem.points[pIdx]={x:pos.x,y:pos.y}; }
    } else if (dragStart) {
      const dx=pos.x-dragStart.x, dy=pos.y-dragStart.y;
      moveElem(elem,dx,dy);
      setDragStart(pos);
    }
    elements[selectedIdx] = elem;
    onUpdateImage(imageData.id, im => ({ ...im, elements }));
    // Overlay mitbewegen
    setOverlayPos(calcOverlayPos(elem));
  }, [isDragging, selectedIdx, resizePart, dragStart, imageData,
      pencilMode, lassoMode, lassoImageId, isGroupDragging, groupDragImageId,
      eraserActive, eraserHistoryPushed, toCanvas,
      onUpdateImage, onUpdatePencilPreview, onPushHistory,
      onLassoExtend, onGroupDragMove, hideOverlay, calcOverlayPos]);

  // ── Pointer Up ───────────────────────────────────────────
  const handlePointerUp = useCallback((e) => {
    const nativeEvt = e.evt;
    const pointerType = nativeEvt?.pointerType || 'pen';

    // F4-07: Drag-to-draw — letzten Punkt beim Heben setzen
    if (pencilMode && pencilMode.imageId === imageData.id && pointerType === 'pen') {
      const pos = toCanvas(e);
      const lastPt = pencilMode.points[pencilMode.points.length - 1];
      if (lastPt && Math.hypot(pos.x - lastPt.x, pos.y - lastPt.y) > 15) {
        onAddPencilPoint(pos);
      }
    }

    // LASSO ABSCHLIESSEN (F3-03)
    if (lassoMode && pointerType === 'pen') {
      if (isGroupDragging) {
        onGroupDragEnd();
      } else {
        onLassoFinish(imageData.id, imageData.elements);
      }
    }

    setIsDragging(false);
    setResizePart(null);
    setEraserActive(false);
  }, [lassoMode, isGroupDragging, imageData, onGroupDragEnd, onLassoFinish]);

  const handleDblClick = useCallback(() => {
    if (pencilMode && pencilMode.imageId === imageData.id) onFinishDrawing();
  }, [pencilMode, imageData.id, onFinishDrawing]);

  // ── Delete / Copy ────────────────────────────────────────
  const handleDelete = () => {
    if (overlayElemIdx < 0) return;
    onPushHistory(imageData.id);
    onUpdateImage(imageData.id, im => {
      const elems = [...im.elements];
      elems.splice(overlayElemIdx, 1);
      return { ...im, elements: elems };
    });
    setSelectedIdx(-1);
    hideOverlay();
  };

  const handleCopy = () => {
    if (overlayElemIdx < 0) return;
    onCopyElement(imageData.id, overlayElemIdx);
    hideOverlay();
    setSelectedIdx(-1);
  };

  // ── Lasso-Daten für dieses Bild ──────────────────────────
  const myLassoPath = lassoImageId === imageData.id ? lassoPath : [];
  const myGroupElems = selectedGroup.filter(s => s.imageId === imageData.id);

  return (
    <div style={{ ...cardStyles.card, ...(isActive ? cardStyles.activeCard : {}) }}>
      {/* Card Header */}
      <div style={cardStyles.header}>
        <div style={cardStyles.title}>
          <div style={{ ...cardStyles.badge, ...(imageData.showPageNumber ? {} : cardStyles.badgeOff) }}>
            {imageData.autoNumber}
          </div>
          <span style={cardStyles.name}>{imageData.name}</span>
        </div>
        <div style={cardStyles.actions}>
          <button style={cardStyles.btn} onClick={() => onUndo(imageData.id)}>↶ Undo</button>
          <button style={cardStyles.btnDanger} onClick={() => onDelete(imageData.id)}>✕</button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} style={{ background:'#f5f5f7', borderRadius:10, position:'relative' }}
           onClick={() => onSetActive(imageData.id)}>
        <Stage
          ref={stageRef}
          width={dispW}
          height={dispH}
          scaleX={scaleX}
          scaleY={scaleY}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDblClick={handleDblClick}
          style={{ touchAction:'none', display:'block' }}
        >
          <Layer>
            <KonvaImage image={imageData.image} width={imageData.image.width} height={imageData.image.height}/>

            {/* Elemente */}
            {imageData.elements.map((elem, idx) =>
              renderElement(elem, idx === selectedIdx, idx, imageData.image.width)
            )}

            {/* Gruppen-Highlight (F3-03) */}
            {myGroupElems.map((s, i) => {
              const elem = imageData.elements[s.index];
              if (!elem) return null;
              const c = getElementCenter(elem);
              if (!c) return null;
              return <Circle key={i} x={c.x} y={c.y} radius={24} stroke="#007AFF" strokeWidth={3} fill="rgba(0,122,255,0.07)" opacity={0.8}/>;
            })}

            {/* Lasso-Pfad (F3-03) */}
            {myLassoPath.length > 1 && (
              <Line
                points={myLassoPath.flatMap(p => [p.x, p.y])}
                stroke="#007AFF" strokeWidth={2}
                dash={[6,4]} closed
                fill="rgba(0,122,255,0.08)"
                opacity={0.85}
              />
            )}

            {/* Pencil-Vorschau */}
            {pencilMode?.imageId === imageData.id && pencilMode.points.length > 0 && (
              <Line
                points={[
                  ...pencilMode.points.flatMap(p => [p.x, p.y]),
                  ...(pencilMode.currentPos ? [pencilMode.currentPos.x, pencilMode.currentPos.y] : [])
                ]}
                stroke={pencilMode.color === 'blue' ? COLORS.BLUE : COLORS.PURPLE}
                strokeWidth={4} lineCap="round" lineJoin="round"
              />
            )}
          </Layer>
        </Stage>
      </div>

      {/* Delete + Copy Overlay (F3-08) — fixed über Canvas */}
      {overlayPos && (
        <>
          <button
            onClick={handleCopy}
            style={{ ...overlayBtn, background:'#007AFF', left: overlayPos.x + 36, top: overlayPos.y }}
            title="Kopieren"
          >⧉</button>
          <button
            onClick={handleDelete}
            style={{ ...overlayBtn, background:'#FF3B30', left: overlayPos.x, top: overlayPos.y }}
            title="Löschen"
          >×</button>
        </>
      )}

      {/* Card Footer */}
      <div style={cardStyles.footer}>
        <span>{imageData.elements.length} Elemente</span>
        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
          <button style={cardStyles.zoomBtn} onClick={() => setZoom(z => Math.max(0.2, z-0.25))}>−</button>
          <span style={{ fontSize:11, fontWeight:600, minWidth:38, textAlign:'center' }}>{Math.round(zoom*100)}%</span>
          <button style={cardStyles.zoomBtn} onClick={() => setZoom(z => Math.min(4, z+0.25))}>+</button>
          <button style={{ ...cardStyles.zoomBtn, fontSize:11 }} onClick={() => setZoom(CONFIG.DEFAULT_ZOOM)}>⟲</button>
        </div>
        <span>{imageData.image.width}×{imageData.image.height}</span>
      </div>
    </div>
  );
}

/* ── Element-Rendering ── */
const HR = CONFIG.HANDLE_RADIUS; // F3-06: 18px

function renderElement(elem, isSelected, key) {
  switch (elem.type) {
    case 'line': return (
      <React.Fragment key={key}>
        <Line points={[elem.x1,elem.y1,elem.x2,elem.y2]} stroke={elem.color} strokeWidth={elem.lineWidth} lineCap="round"/>
        {isSelected && <>
          <Circle x={elem.x1} y={elem.y1} radius={HR} fill="#34C759" stroke="white" strokeWidth={3}/>
          <Circle x={elem.x2} y={elem.y2} radius={HR} fill="#007AFF" stroke="white" strokeWidth={3}/>
        </>}
      </React.Fragment>
    );
    case 'line_circle': {
      // F4-08: Linie endet am Kreisrand
      const angle = Math.atan2(elem.y2 - elem.y1, elem.x2 - elem.x1);
      const lEx = elem.x2 - elem.circleRadius * Math.cos(angle);
      const lEy = elem.y2 - elem.circleRadius * Math.sin(angle);
      return (
      <React.Fragment key={key}>
        <Line points={[elem.x1,elem.y1,lEx,lEy]} stroke={elem.color} strokeWidth={elem.lineWidth} lineCap="round"/>
        <Circle x={elem.x2} y={elem.y2} radius={elem.circleRadius} stroke={elem.circleColor} strokeWidth={elem.lineWidth} fill="transparent"/>
        {isSelected && <>
          <Circle x={elem.x1} y={elem.y1} radius={HR} fill="#34C759" stroke="white" strokeWidth={3}/>
          <Circle x={elem.x2} y={elem.y2} radius={HR} fill="#007AFF" stroke="white" strokeWidth={3}/>
        </>}
      </React.Fragment>
    );}
    case 'polyline': {
      const pts = elem.points || [];
      // F4-05: Segment-Midpoint Minus-Marker
      const segMarkers = isSelected ? pts.slice(0,-1).map((p,i) => ({
        x:(p.x+pts[i+1].x)/2, y:(p.y+pts[i+1].y)/2, i
      })) : [];
      return (
        <React.Fragment key={key}>
          <Line points={pts.flatMap(p=>[p.x,p.y])} stroke={elem.color} strokeWidth={elem.lineWidth} lineCap="round" lineJoin="round"/>
          {isSelected && pts.map((p,i) => (
            <Circle key={i} x={p.x} y={p.y} radius={HR} fill="#007AFF" stroke="white" strokeWidth={3}/>
          ))}
          {segMarkers.map(({x,y,i}) => (
            <React.Fragment key={`seg${i}`}>
              <Circle x={x} y={y} radius={14} fill="#FF3B30" stroke="white" strokeWidth={2}/>
              <Text x={x-8} y={y-10} text="−" fontSize={20} fill="white" fontStyle="bold"/>
            </React.Fragment>
          ))}
        </React.Fragment>
      );
    }
    case 'circle': return (
      <React.Fragment key={key}>
        <Circle x={elem.x} y={elem.y} radius={elem.radius} stroke={elem.color} strokeWidth={elem.lineWidth} fill="transparent"/>
        {isSelected && <Circle x={elem.x+elem.radius} y={elem.y} radius={HR} fill="#007AFF" stroke="white" strokeWidth={3}/>}
      </React.Fragment>
    );
    case 'rect': return (
      <React.Fragment key={key}>
        <Rect x={elem.x} y={elem.y} width={elem.width} height={elem.height} stroke={elem.color} strokeWidth={elem.lineWidth} fill="transparent"/>
        {isSelected && <Circle x={elem.x+elem.width} y={elem.y+elem.height} radius={HR} fill="#007AFF" stroke="white" strokeWidth={3}/>}
      </React.Fragment>
    );
    case 'gfta': {
      const rot = elem.rotation || 0;
      if (rot === 0) return (
        <React.Fragment key={key}>
          <Rect x={elem.x1} y={elem.y1} width={elem.width} height={elem.height} stroke={elem.color} strokeWidth={elem.lineWidth} fill="transparent"/>
          <Rect x={elem.x1+elem.width+elem.spacing} y={elem.y1} width={elem.width} height={elem.height} stroke={elem.color} strokeWidth={elem.lineWidth} fill="transparent"/>
          {isSelected && <Circle x={elem.x1+elem.width*2+elem.spacing} y={elem.y1+elem.height} radius={HR} fill="#007AFF" stroke="white" strokeWidth={3}/>}
        </React.Fragment>
      );
      return (
        <React.Fragment key={key}>
          <Rect x={elem.x1} y={elem.y1} width={elem.width} height={elem.height} stroke={elem.color} strokeWidth={elem.lineWidth} fill="transparent"/>
          <Rect x={elem.x1} y={elem.y1+elem.height+elem.spacing} width={elem.width} height={elem.height} stroke={elem.color} strokeWidth={elem.lineWidth} fill="transparent"/>
          {isSelected && <Circle x={elem.x1+elem.width} y={elem.y1+elem.height*2+elem.spacing} radius={HR} fill="#007AFF" stroke="white" strokeWidth={3}/>}
        </React.Fragment>
      );
    }
    case 'text': return (
      <Text key={key} x={elem.x} y={elem.y} text={elem.text} fontSize={elem.fontSize}
        fontStyle="900" fill={elem.color}
        padding={8} backgroundRect={{ fill:'rgba(255,255,255,0.94)' }}
      />
    );
    default: return null;
  }
}

function moveElem(elem, dx, dy) {
  switch (elem.type) {
    case 'line': case 'line_circle': elem.x1+=dx; elem.y1+=dy; elem.x2+=dx; elem.y2+=dy; break;
    case 'polyline': elem.points?.forEach(p => { p.x+=dx; p.y+=dy; }); break;
    case 'circle': elem.x+=dx; elem.y+=dy; break;
    case 'rect': elem.x+=dx; elem.y+=dy; break;
    case 'gfta': elem.x1+=dx; elem.y1+=dy; break;
    case 'text': elem.x+=dx; elem.y+=dy; break;
  }
}

const overlayBtn = {
  position:'fixed', zIndex:600, width:34, height:34, borderRadius:'50%',
  color:'white', border:'2px solid white', fontSize:18, fontWeight:700,
  cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
  boxShadow:'0 3px 10px rgba(0,0,0,0.3)', touchAction:'none', transform:'translateY(-50%)',
};

const cardStyles = {
  card: { background:'white', borderRadius:14, marginBottom:18, padding:13, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'2px solid transparent' },
  activeCard: { borderColor:'#007AFF', boxShadow:'0 2px 20px rgba(0,122,255,0.12)' },
  header: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10, paddingBottom:10, borderBottom:'1px solid #f0f0f2', flexWrap:'wrap', gap:6 },
  title: { display:'flex', alignItems:'center', gap:7, fontWeight:700, fontSize:13, color:'#1a1a1a', flex:1 },
  badge: { width:27, height:27, background:'linear-gradient(135deg,#007AFF,#0055CC)', color:'white', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13 },
  badgeOff: { background:'#bbb' },
  name: { overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12, color:'#777' },
  actions: { display:'flex', gap:4 },
  btn: { padding:'5px 9px', minHeight:30, border:'1.5px solid #e8e8ea', borderRadius:7, background:'white', color:'#333', fontSize:12, fontWeight:600, cursor:'pointer' },
  btnDanger: { padding:'5px 9px', minHeight:30, border:'1.5px solid rgba(255,59,48,0.33)', borderRadius:7, background:'white', color:'#FF3B30', fontSize:12, fontWeight:600, cursor:'pointer' },
  footer: { display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8, paddingTop:8, borderTop:'1px solid #f0f0f2', fontSize:11, color:'#999', flexWrap:'wrap', gap:6 },
  zoomBtn: { width:26, height:26, padding:0, borderRadius:6, background:'#f0f0f2', color:'#333', border:'1px solid #e0e0e2', fontSize:15, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
};
