/**
 * MODUL 6: HIT DETECTION
 * Erkennt welches Element an einer Canvas-Position getroffen wird.
 */

export function getElementAtPoint(elements, x, y) {
  const buffer = 20;

  for (let i = elements.length - 1; i >= 0; i--) {
    const elem = elements[i];
    switch (elem.type) {
      case 'line':
        if (Math.hypot(x-elem.x1, y-elem.y1) < 24) return { index:i, part:'start' };
        if (Math.hypot(x-elem.x2, y-elem.y2) < 24) return { index:i, part:'end' };
        if (ptLineDist(x,y,elem.x1,elem.y1,elem.x2,elem.y2) < buffer
            && withinSeg(x,y,elem.x1,elem.y1,elem.x2,elem.y2)) return { index:i, part:'body' };
        break;
      case 'line_circle':
        if (Math.hypot(x-elem.x1, y-elem.y1) < 24) return { index:i, part:'start' };
        if (Math.hypot(x-elem.x2, y-elem.y2) < 24) return { index:i, part:'end' };
        if (Math.hypot(x-elem.x2, y-elem.y2) <= elem.circleRadius+buffer) return { index:i, part:'body' };
        if (ptLineDist(x,y,elem.x1,elem.y1,elem.x2,elem.y2) < buffer
            && withinSeg(x,y,elem.x1,elem.y1,elem.x2,elem.y2)) return { index:i, part:'body' };
        break;
      case 'polyline':
        if (!elem.points) break;
        for (let p = 0; p < elem.points.length; p++) {
          if (Math.hypot(x-elem.points[p].x, y-elem.points[p].y) < 22) return { index:i, part:`point_${p}` };
        }
        for (let p = 0; p < elem.points.length - 1; p++) {
          const p1 = elem.points[p], p2 = elem.points[p+1];
          if (ptLineDist(x,y,p1.x,p1.y,p2.x,p2.y) < buffer
              && withinSeg(x,y,p1.x,p1.y,p2.x,p2.y)) return { index:i, part:`seg_${p}` };
        }
        break;
      case 'circle':
        if (Math.hypot(x-(elem.x+elem.radius), y-elem.y) < 20) return { index:i, part:'resize' };
        if (Math.hypot(x-elem.x, y-elem.y) <= elem.radius+buffer) return { index:i, part:'body' };
        break;
      case 'rect':
        if (Math.hypot(x-(elem.x+elem.width), y-(elem.y+elem.height)) < 20) return { index:i, part:'resize' };
        if (x>=elem.x-buffer && x<=elem.x+elem.width+buffer
            && y>=elem.y-buffer && y<=elem.y+elem.height+buffer) return { index:i, part:'body' };
        break;
      case 'gfta': {
        const rot = elem.rotation || 0;
        const tw = rot===0 ? elem.width*2+elem.spacing : elem.width;
        const th = rot===0 ? elem.height : elem.height*2+elem.spacing;
        if (Math.hypot(x-(elem.x1+tw), y-(elem.y1+th)) < 20) return { index:i, part:'resize' };
        if (x>=elem.x1-buffer && x<=elem.x1+tw+buffer
            && y>=elem.y1-buffer && y<=elem.y1+th+buffer) return { index:i, part:'body' };
        break;
      }
      case 'text': {
        const approxWidth = elem.text.length * elem.fontSize * 0.55 + 16;
        if (x>=elem.x-12 && x<=elem.x+approxWidth && y>=elem.y-8 && y<=elem.y+elem.fontSize+20)
          return { index:i, part:'body' };
        break;
      }
    }
  }
  return null;
}

export function getElementCenter(elem) {
  switch(elem.type) {
    case 'line': case 'line_circle':
      return { x:(elem.x1+elem.x2)/2, y:(elem.y1+elem.y2)/2 };
    case 'polyline':
      if (elem.points && elem.points.length > 0) {
        const mid = Math.floor(elem.points.length / 2);
        return { x:elem.points[mid].x, y:elem.points[mid].y };
      }
      return null;
    case 'circle': return { x:elem.x, y:elem.y };
    case 'rect':   return { x:elem.x+elem.width/2, y:elem.y+elem.height/2 };
    case 'gfta':   return { x:elem.x1+elem.width, y:elem.y1+elem.height/2 };
    case 'text':   return { x:elem.x, y:elem.y };
    default: return null;
  }
}

// F3-03: Punkt-in-Polygon (Ray Casting)
export function isPointInPolygon(pt, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if (((yi > pt.y) !== (yj > pt.y)) && (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi))
      inside = !inside;
  }
  return inside;
}

function ptLineDist(px, py, x1, y1, x2, y2) {
  const num = Math.abs((y2-y1)*px - (x2-x1)*py + x2*y1 - y2*x1);
  const den = Math.hypot(y2-y1, x2-x1) || 1;
  return num / den;
}

function withinSeg(px, py, x1, y1, x2, y2) {
  return px>=Math.min(x1,x2)-12 && px<=Math.max(x1,x2)+12
      && py>=Math.min(y1,y2)-12 && py<=Math.max(y1,y2)+12;
}
