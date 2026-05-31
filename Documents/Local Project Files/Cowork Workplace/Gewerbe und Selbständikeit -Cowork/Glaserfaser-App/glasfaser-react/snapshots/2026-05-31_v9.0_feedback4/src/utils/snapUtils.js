/**
 * MODUL 7: SNAP & HILFSLINIEN
 * Magnet-Funktion + Ausrichtungs-Snap (90°/45°)
 */
import { CONFIG } from '../constants';

export function findSnapPoint(elements, x, y, ignoreIndex = -1) {
  let nearest = null;
  let minDist = CONFIG.SNAP_RADIUS;

  elements.forEach((elem, idx) => {
    if (idx === ignoreIndex) return;
    const sp = getSnapPoints(elem);
    sp.forEach(s => {
      const d = Math.hypot(x - s.x, y - s.y);
      if (d < minDist) { minDist = d; nearest = s; }
    });
  });
  return nearest;
}

function getSnapPoints(elem) {
  switch (elem.type) {
    case 'line':
      return [
        { x:elem.x1, y:elem.y1 }, { x:elem.x2, y:elem.y2 },
        { x:(elem.x1+elem.x2)/2, y:(elem.y1+elem.y2)/2 }
      ];
    case 'line_circle':
      return [
        { x:elem.x1, y:elem.y1 }, { x:elem.x2, y:elem.y2 },
        { x:elem.x2+elem.circleRadius, y:elem.y2 }, { x:elem.x2-elem.circleRadius, y:elem.y2 },
        { x:elem.x2, y:elem.y2+elem.circleRadius }, { x:elem.x2, y:elem.y2-elem.circleRadius },
      ];
    case 'polyline':
      return (elem.points || []).map(p => ({ x:p.x, y:p.y }));
    case 'circle':
      return [
        { x:elem.x, y:elem.y }, { x:elem.x+elem.radius, y:elem.y },
        { x:elem.x-elem.radius, y:elem.y }, { x:elem.x, y:elem.y+elem.radius },
        { x:elem.x, y:elem.y-elem.radius },
      ];
    case 'rect':
      return [
        { x:elem.x, y:elem.y }, { x:elem.x+elem.width, y:elem.y },
        { x:elem.x, y:elem.y+elem.height }, { x:elem.x+elem.width, y:elem.y+elem.height },
        { x:elem.x+elem.width/2, y:elem.y }, { x:elem.x+elem.width/2, y:elem.y+elem.height },
        { x:elem.x, y:elem.y+elem.height/2 }, { x:elem.x+elem.width, y:elem.y+elem.height/2 },
        { x:elem.x+elem.width/2, y:elem.y+elem.height/2 },
      ];
    default: return [];
  }
}

export function getAlignmentSnap(startX, startY, currentX, currentY) {
  const dx = currentX - startX;
  const dy = currentY - startY;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const threshold = 5;
  let snappedX = currentX, snappedY = currentY;
  const guides = [];

  if (Math.abs(angle - 90) < threshold || Math.abs(angle + 90) < threshold) {
    snappedX = startX; guides.push({ type:'vertical', x:startX });
  }
  if (Math.abs(angle) < threshold || Math.abs(Math.abs(angle) - 180) < threshold) {
    snappedY = startY; guides.push({ type:'horizontal', y:startY });
  }
  if (Math.abs(Math.abs(angle) - 45) < threshold || Math.abs(Math.abs(angle) - 135) < threshold) {
    const len = Math.hypot(dx, dy);
    const signX = dx > 0 ? 1 : -1, signY = dy > 0 ? 1 : -1;
    snappedX = startX + signX * len / Math.sqrt(2);
    snappedY = startY + signY * len / Math.sqrt(2);
  }
  return { x: snappedX, y: snappedY, guides };
}
