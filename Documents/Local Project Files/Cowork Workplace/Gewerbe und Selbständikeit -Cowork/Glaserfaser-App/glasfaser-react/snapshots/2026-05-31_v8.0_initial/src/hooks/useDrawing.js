/**
 * MODUL 8: ZICKZACK/POLYLINE (Hook)
 * Pencil-Zeichenmodus State und Logik.
 */
import { useState, useCallback } from 'react';

export function useDrawing() {
  const [pencilMode, setPencilMode] = useState(null);
  // pencilMode: { color, imageId, points: [{x,y}], currentPos, pointHistory }

  const startPencilDraw = useCallback((color, imageId) => {
    setPencilMode({ color, imageId, points: [], currentPos: null, pointHistory: [] });
  }, []);

  const addPencilPoint = useCallback((point) => {
    setPencilMode(prev => {
      if (!prev) return null;
      return {
        ...prev,
        pointHistory: [...prev.pointHistory, [...prev.points]],
        points: [...prev.points, point],
      };
    });
  }, []);

  const undoPencilPoint = useCallback(() => {
    setPencilMode(prev => {
      if (!prev || prev.pointHistory.length === 0) return prev;
      const pointHistory = [...prev.pointHistory];
      const points = pointHistory.pop();
      return { ...prev, points, pointHistory };
    });
  }, []);

  const updatePencilPreview = useCallback((pos) => {
    setPencilMode(prev => prev ? { ...prev, currentPos: pos } : null);
  }, []);

  const cancelDrawing = useCallback(() => {
    setPencilMode(null);
  }, []);

  return {
    pencilMode,
    startPencilDraw,
    addPencilPoint,
    undoPencilPoint,
    updatePencilPreview,
    cancelDrawing,
  };
}
