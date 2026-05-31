/**
 * MODUL 10: BILD-VERWALTUNG (Hook)
 * Zentraler State für alle geladenen Bilder.
 * Zentrale Eingangs-Funktion: processNewImage() — 
 * sowohl Upload als auch spätere Kamera-Funktion übergeben Bilder hier.
 */
import { useState, useCallback } from 'react';
import { CONFIG } from '../constants';

function createImageId() {
  return 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

export function useImages() {
  const [images, setImages]       = useState([]);
  const [activeImageId, setActiveId] = useState(null);

  /**
   * Zentrale Bild-Eingangs-Funktion.
   * Upload und (später) Kamera übergeben ihr Bild hier.
   */
  const processNewImage = useCallback((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          setImages(prev => {
            const autoNumber = prev.length + 1;
            const showPageNumber = autoNumber >= CONFIG.PAGE_NUMBER_OFFSET + 1;
            const newImg = {
              id: createImageId(),
              name: file.name,
              image: img,
              imageDataUrl: ev.target.result,
              elements: [],
              history: [],
              eraserMode: false,
              selected: true,
              autoNumber,
              showPageNumber,
            };
            // Seitennummer-Element hinzufügen (wenn fällig)
            if (showPageNumber) {
              const fontSize = Math.max(28, Math.min(60, img.width / 35));
              newImg.elements = [{
                type: 'text',
                text: String(autoNumber - CONFIG.PAGE_NUMBER_OFFSET),
                x: Math.round(img.width / 2 - fontSize * 0.3),
                y: Math.round(img.height - fontSize * 2.5),
                color: '#FF9500',
                fontSize,
                isAutoNumber: true,
              }];
            }
            const updated = [...prev, newImg];
            return updated;
          });
          resolve();
        };
        img.onerror = () => resolve();
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const uploadImages = useCallback(async (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    // Sequenziell laden — Reihenfolge beibehalten
    for (const file of imageFiles) {
      await processNewImage(file);
    }
  }, [processNewImage]);

  const deleteImage = useCallback((imageId) => {
    setImages(prev => {
      const updated = prev.filter(i => i.id !== imageId);
      // Nummern neu vergeben
      return updated.map((img, idx) => ({ ...img, autoNumber: idx + 1 }));
    });
  }, []);

  const updateImage = useCallback((imageId, updater) => {
    setImages(prev => prev.map(img => img.id === imageId ? updater(img) : img));
  }, []);

  const pushHistory = useCallback((imageId) => {
    updateImage(imageId, img => ({
      ...img,
      history: [
        ...img.history.slice(-CONFIG.MAX_HISTORY + 1),
        JSON.parse(JSON.stringify(img.elements))
      ],
    }));
  }, [updateImage]);

  const undoLast = useCallback((imageId) => {
    updateImage(imageId, img => {
      if (img.history.length === 0) return img;
      const history = [...img.history];
      const elements = history.pop();
      return { ...img, elements, history };
    });
  }, [updateImage]);

  const reorderImages = useCallback((fromId, toId, before) => {
    setImages(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(i => i.id === fromId);
      const [moved] = arr.splice(fromIdx, 1);
      const toIdx = arr.findIndex(i => i.id === toId);
      arr.splice(before ? toIdx : toIdx + 1, 0, moved);
      return arr.map((img, idx) => ({ ...img, autoNumber: idx + 1 }));
    });
  }, []);

  const clearAll = useCallback(() => {
    setImages([]);
    setActiveId(null);
  }, []);

  return {
    images, setImages,
    activeImageId, setActiveId,
    uploadImages, processNewImage,
    deleteImage, updateImage,
    pushHistory, undoLast,
    reorderImages, clearAll,
  };
}
