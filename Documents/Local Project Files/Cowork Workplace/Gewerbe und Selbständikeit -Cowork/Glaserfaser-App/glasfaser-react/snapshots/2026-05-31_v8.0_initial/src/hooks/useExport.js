/**
 * MODUL 11: EXPORT (Hook)
 * ZIP-Export, JSON-Speichern.
 */
import { useCallback } from 'react';
import { exportAsZip, getZipFilename, downloadBlob } from '../utils/exportUtils';

export function useExport(images, address, drawFn) {
  const exportZip = useCallback(async () => {
    const toExport = images.filter(i => i.selected).length > 0
      ? images.filter(i => i.selected)
      : images;
    if (toExport.length === 0) return;
    const blob = await exportAsZip(toExport, address, drawFn);
    downloadBlob(blob, getZipFilename(address));
  }, [images, address, drawFn]);

  return { exportZip };
}
