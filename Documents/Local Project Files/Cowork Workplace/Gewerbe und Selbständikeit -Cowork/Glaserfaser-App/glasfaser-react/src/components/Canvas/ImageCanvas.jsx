/**
 * MODUL 5 + 6: CANVAS-RENDERING + TOUCH/PENCIL-EVENTS
 * Ein einzelnes Bild mit Canvas, Zoom-Steuerung und Pointer-Events.
 * Nutzt react-konva für die Zeichenfläche.
 */
import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Line, Circle, Rect, Text, Group } from 'react-konva';
import { CONFIG, COLORS } from '../../constants';
import { getElementAtPoint } from '../../utils/hitDetection';
import { findSnapPoint, getAlignmentSnap } from '../../utils/snapUtils';

export default function ImageCanvas({
  imageData,
  isActive,
  onSetActive,
  selectToolActive,
  pencilMode,
  onAddPencilPoint,
  onUpdatePencilPreview,
  onFinishDrawing,
  onCancelDrawing,
  onUpdateImage,
  onPushHistory,
  onUndo,
  onDelete,
}) {
  const [zoom, setZoom] = useState(CONFIG.DEFAULT_ZOOM);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [resizePart, setResizePart] = useState(null);
  const stageRef = useRef(null);

  const MAX_W = CONFIG.MAX_DISPLAY_WIDTH;
  const aspect = imageData.image.height / imageData.image.width;
  const baseW  = Math.min(MAX_W, imageData.image.width);
  const dispW  = baseW * zoom;
  const dispH  = dispW * aspect;
  const scaleX = dispW / imageData.image.width;
  const scaleY = dispH / imageData.image.height;

  // Pointer → Canvas-Koordinaten
  const toCanvas = useCallback((e) => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    return { x: pos.x / scaleX, y: pos.y / scaleY };
  }, [scaleX, scaleY]);

  const handleStagePointerDown = useCallback((e) => {
    onSetActive(imageData.id);
    const pos = toCanvas(e);

    // Pencil-Modus
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

    // Element auswählen
    const hit = getElementAtPoint(imageData.elements, pos.x, pos.y);
    if (hit) {
      const elem = imageData.elements[hit.index];
      const isText = elem?.type === 'text';
      if (!isText && !selectToolActive) { setSelectedIdx(-1); return; }
      onPushHistory(imageData.id);
      setSelectedIdx(hit.index);
      setIsDragging(true);
      setDragStart(pos);
      setResizePart(['start','end','resize'].includes(hit.part) || hit.part?.startsWith('point_') ? hit.part : null);
    } else {
      setSelectedIdx(-1);
    }
  }, [imageData, pencilMode, selectToolActive, toCanvas, onAddPencilPoint, onPushHistory, onSetActive]);

  const handleStagePointerMove = useCallback((e) => {
    const pos = toCanvas(e);
    if (pencilMode && pencilMode.imageId === imageData.id) {
      onUpdatePencilPreview(pos);
      return;
    }
    if (!isDragging || selectedIdx < 0) return;
    const elements = [...imageData.elements];
    const elem = { ...elements[selectedIdx] };
    if (resizePart === 'start') { elem.x1 = pos.x; elem.y1 = pos.y; }
    else if (resizePart === 'end') { elem.x2 = pos.x; elem.y2 = pos.y; }
    else if (resizePart === 'resize') {
      if (elem.type === 'circle') elem.radius = Math.max(10, Math.hypot(pos.x - elem.x, pos.y - elem.y));
      else if (elem.type === 'rect') { elem.width = Math.max(20, pos.x - elem.x); elem.height = Math.max(20, pos.y - elem.y); }
    } else if (dragStart) {
      const dx = pos.x - dragStart.x, dy = pos.y - dragStart.y;
      moveElem(elem, dx, dy);
      setDragStart(pos);
    }
    elements[selectedIdx] = elem;
    onUpdateImage(imageData.id, img => ({ ...img, elements }));
  }, [isDragging, selectedIdx, resizePart, dragStart, imageData, pencilMode, toCanvas, onUpdateImage, onUpdatePencilPreview]);

  const handleStagePointerUp = useCallback(() => {
    setIsDragging(false);
    setResizePart(null);
  }, []);

  const handleDblClick = useCallback(() => {
    if (pencilMode && pencilMode.imageId === imageData.id) onFinishDrawing();
  }, [pencilMode, imageData.id, onFinishDrawing]);

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
      <div style={{ overflowAuto: 'auto', background: '#f5f5f7', borderRadius: 10 }} onClick={() => onSetActive(imageData.id)}>
        <Stage
          ref={stageRef}
          width={dispW}
          height={dispH}
          scaleX={scaleX}
          scaleY={scaleY}
          onPointerDown={handleStagePointerDown}
          onPointerMove={handleStagePointerMove}
          onPointerUp={handleStagePointerUp}
          onDblClick={handleDblClick}
          style={{ touchAction: 'none', display: 'block' }}
        >
          <Layer>
            <KonvaImage image={imageData.image} width={imageData.image.width} height={imageData.image.height}/>
            {imageData.elements.map((elem, idx) =>
              renderElement(elem, idx === selectedIdx, idx, imageData.image.width)
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

      {/* Card Footer */}
      <div style={cardStyles.footer}>
        <span>{imageData.elements.length} Elemente</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button style={cardStyles.zoomBtn} onClick={() => setZoom(z => Math.max(0.2, z - 0.25))}>−</button>
          <span style={{ fontSize: 11, fontWeight: 600, minWidth: 38, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button style={cardStyles.zoomBtn} onClick={() => setZoom(z => Math.min(4, z + 0.25))}>+</button>
          <button style={{ ...cardStyles.zoomBtn, fontSize: 11 }} onClick={() => setZoom(CONFIG.DEFAULT_ZOOM)}>⟲</button>
        </div>
        <span>{imageData.image.width}×{imageData.image.height}</span>
      </div>
    </div>
  );
}

/* ── Element-Rendering ── */
function renderElement(elem, isSelected, key, canvasW) {
  switch (elem.type) {
    case 'line': return (
      <React.Fragment key={key}>
        <Line points={[elem.x1,elem.y1,elem.x2,elem.y2]} stroke={elem.color} strokeWidth={elem.lineWidth} lineCap="round"/>
        {isSelected && <>
          <Circle x={elem.x1} y={elem.y1} radius={11} fill="#34C759" stroke="white" strokeWidth={3}/>
          <Circle x={elem.x2} y={elem.y2} radius={11} fill="#007AFF" stroke="white" strokeWidth={3}/>
        </>}
      </React.Fragment>
    );
    case 'line_circle': return (
      <React.Fragment key={key}>
        <Line points={[elem.x1,elem.y1,elem.x2,elem.y2]} stroke={elem.color} strokeWidth={elem.lineWidth} lineCap="round"/>
        <Circle x={elem.x2} y={elem.y2} radius={elem.circleRadius} stroke={elem.circleColor} strokeWidth={elem.lineWidth} fill="transparent"/>
        {isSelected && <>
          <Circle x={elem.x1} y={elem.y1} radius={11} fill="#34C759" stroke="white" strokeWidth={3}/>
          <Circle x={elem.x2} y={elem.y2} radius={11} fill="#007AFF" stroke="white" strokeWidth={3}/>
        </>}
      </React.Fragment>
    );
    case 'polyline': return (
      <Line key={key} points={elem.points?.flatMap(p=>[p.x,p.y])??[]} stroke={elem.color} strokeWidth={elem.lineWidth} lineCap="round" lineJoin="round"/>
    );
    case 'circle': return (
      <Circle key={key} x={elem.x} y={elem.y} radius={elem.radius} stroke={elem.color} strokeWidth={elem.lineWidth} fill="transparent"/>
    );
    case 'rect': return (
      <Rect key={key} x={elem.x} y={elem.y} width={elem.width} height={elem.height} stroke={elem.color} strokeWidth={elem.lineWidth} fill="transparent"/>
    );
    case 'gfta': {
      const rot = elem.rotation || 0;
      if (rot === 0) return (
        <React.Fragment key={key}>
          <Rect x={elem.x1} y={elem.y1} width={elem.width} height={elem.height} stroke={elem.color} strokeWidth={elem.lineWidth} fill="transparent"/>
          <Rect x={elem.x1+elem.width+elem.spacing} y={elem.y1} width={elem.width} height={elem.height} stroke={elem.color} strokeWidth={elem.lineWidth} fill="transparent"/>
        </React.Fragment>
      );
      return (
        <React.Fragment key={key}>
          <Rect x={elem.x1} y={elem.y1} width={elem.width} height={elem.height} stroke={elem.color} strokeWidth={elem.lineWidth} fill="transparent"/>
          <Rect x={elem.x1} y={elem.y1+elem.height+elem.spacing} width={elem.width} height={elem.height} stroke={elem.color} strokeWidth={elem.lineWidth} fill="transparent"/>
        </React.Fragment>
      );
    }
    case 'text': return (
      <Text key={key} x={elem.x} y={elem.y} text={elem.text} fontSize={elem.fontSize}
        fontStyle="900" fill={elem.color}
        padding={8} background="rgba(255,255,255,0.94)"
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

const cardStyles = {
  card: { background: 'white', borderRadius: 14, marginBottom: 18, padding: 13, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '2px solid transparent' },
  activeCard: { borderColor: '#007AFF', boxShadow: '0 2px 20px rgba(0,122,255,0.12)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #f0f0f2', flexWrap: 'wrap', gap: 6 },
  title: { display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: 13, color: '#1a1a1a', flex: 1 },
  badge: { width: 27, height: 27, background: 'linear-gradient(135deg,#007AFF,#0055CC)', color: 'white', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 },
  badgeOff: { background: '#bbb' },
  name: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12, color: '#777' },
  actions: { display: 'flex', gap: 4 },
  btn: { padding: '5px 9px', minHeight: 30, border: '1.5px solid #e8e8ea', borderRadius: 7, background: 'white', color: '#333', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  btnDanger: { padding: '5px 9px', minHeight: 30, border: '1.5px solid rgba(255,59,48,0.33)', borderRadius: 7, background: 'white', color: '#FF3B30', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f2', fontSize: 11, color: '#999', flexWrap: 'wrap', gap: 6 },
  zoomBtn: { width: 26, height: 26, padding: 0, borderRadius: 6, background: '#f0f0f2', color: '#333', border: '1px solid #e0e0e2', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
};
