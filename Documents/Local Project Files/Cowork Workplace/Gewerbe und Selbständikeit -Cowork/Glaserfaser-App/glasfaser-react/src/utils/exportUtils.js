/**
 * MODUL 11: EXPORT-UTILITIES
 * Erstellt Export-Canvas und ZIP-Datei.
 * Zoom beeinflusst den Export NICHT — immer HD (Originalauflösung).
 */
import JSZip from 'jszip';

export function buildExportCanvas(imageData, drawFn) {
  const ec = document.createElement('canvas');
  ec.width  = imageData.image.width;
  ec.height = imageData.image.height;
  const ctx = ec.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imageData.image, 0, 0);
  // Alle Elemente zeichnen (drawFn aus dem Canvas-Modul)
  imageData.elements.forEach(elem => drawFn(ctx, elem, false));
  return ec;
}

export async function exportAsZip(images, address, drawFn) {
  const zip = new JSZip();
  for (const img of images) {
    const basename = img.name.replace(/\.[^/.]+$/, '');
    const json = {
      version: '7.0', name: img.name,
      timestamp: new Date().toISOString(),
      canvasWidth: img.image.width, canvasHeight: img.image.height,
      elements: img.elements,
    };
    zip.file(`${basename}.json`, JSON.stringify(json, null, 2));
    const ec   = buildExportCanvas(img, drawFn);
    const blob = await new Promise(r => ec.toBlob(r, 'image/jpeg', 1.0));
    zip.file(`${basename}.jpg`, blob);
  }
  return zip.generateAsync({ type: 'blob' });
}

export function getZipFilename(address) {
  if (address) {
    return address.replace(/[\/\\:*?"<>|]/g, '').replace(/\s+/g, '_') + '.zip';
  }
  const now  = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = `${String(now.getHours()).padStart(2,'0')}-${String(now.getMinutes()).padStart(2,'0')}`;
  return `Hausbegehung_${date}_${time}.zip`;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
