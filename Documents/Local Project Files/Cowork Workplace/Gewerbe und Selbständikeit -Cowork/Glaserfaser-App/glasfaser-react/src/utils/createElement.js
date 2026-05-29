/**
 * MODUL 4: ELEMENT-DEFINITIONEN
 * Fabrik-Funktion: Erstellt ein neues Element anhand seines Typs.
 * Alle Positionierungen sind relativ zur Bildmitte (cx, cy).
 */
import { COLORS, CONFIG } from '../constants';

export function createElement(type, canvasWidth, canvasHeight) {
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const lineWidth  = Math.max(4, canvasWidth / 350);
  const lineLength = Math.max(120, canvasWidth / 5);
  const circleRadius = Math.max(8, canvasWidth / 187);   // Klein: 40% des alten Wertes

  // Linien: horizontal, zentriert im Bild
  const lx1 = Math.round(cx - lineLength / 2);
  const lx2 = Math.round(cx + lineLength / 2);
  const ly  = Math.round(cy);

  const fontSize       = Math.max(22, canvasWidth / 50);
  const numberFontSize = Math.max(32, canvasWidth / 35);

  const templates = {
    // ── Linien ──────────────────────────────────────────────
    line_blue:   { type:'line', x1:lx1, y1:ly, x2:lx2, y2:ly, color:COLORS.BLUE,   lineWidth },
    line_purple: { type:'line', x1:lx1, y1:ly, x2:lx2, y2:ly, color:COLORS.PURPLE, lineWidth },
    line_blue_yellow:   { type:'line_circle', x1:lx1, y1:ly, x2:lx2, y2:ly, color:COLORS.BLUE,   circleColor:COLORS.ORANGE, circleRadius, lineWidth },
    line_blue_red:      { type:'line_circle', x1:lx1, y1:ly, x2:lx2, y2:ly, color:COLORS.BLUE,   circleColor:COLORS.RED,    circleRadius, lineWidth },
    line_purple_yellow: { type:'line_circle', x1:lx1, y1:ly, x2:lx2, y2:ly, color:COLORS.PURPLE, circleColor:COLORS.ORANGE, circleRadius, lineWidth },
    line_purple_red:    { type:'line_circle', x1:lx1, y1:ly, x2:lx2, y2:ly, color:COLORS.PURPLE, circleColor:COLORS.RED,    circleRadius, lineWidth },

    // ── Kreise (transparent, nur Umriss) ────────────────────
    circle_yellow: { type:'circle', x:cx, y:cy, radius:Math.max(10, canvasWidth/175), color:COLORS.ORANGE, lineWidth },
    circle_red:    { type:'circle', x:cx, y:cy, radius:Math.max(10, canvasWidth/175), color:COLORS.RED,    lineWidth },

    // ── Splitter-Rechteck ────────────────────────────────────
    rect_large_yellow: {
      type:'rect', x:cx-CONFIG.SPLITTER_SIZE/2, y:cy-CONFIG.SPLITTER_SIZE/2,
      width:CONFIG.SPLITTER_SIZE, height:CONFIG.SPLITTER_SIZE,
      color:COLORS.ORANGE, lineWidth
    },

    // ── GFTA (zwei getrennte Rechtecke) ─────────────────────
    gfta_horizontal: { type:'gfta', x1:cx-45, y1:cy-20, width:38, height:38, spacing:12, color:COLORS.RED, lineWidth, rotation:0 },
    gfta_vertical:   { type:'gfta', x1:cx-20, y1:cy-45, width:38, height:38, spacing:12, color:COLORS.RED, lineWidth, rotation:90 },
  };

  // Beschriftungs-Texte: alle in Bildmitte
  const LABEL_IDS = [
    'text_zu_eg','text_zu_1og','text_zu_2og','text_zu_treppe',
    'text_linke_kamine','text_rechte_kamine','text_zu_linke_kamine',
    'text_zu_rechte_kamine','text_baugleich'
  ];
  const LABEL_TEXTS_MAP = {
    text_zu_eg:'Zu EG', text_zu_1og:'Zu 1.OG', text_zu_2og:'Zu 2.OG',
    text_zu_treppe:'Zum Treppenhaus', text_linke_kamine:'Linke Kamine',
    text_rechte_kamine:'Rechte Kamine', text_zu_linke_kamine:'Zu linke Kamine',
    text_zu_rechte_kamine:'Zu rechte Kamine', text_baugleich:'Baugleich',
  };
  LABEL_IDS.forEach(id => {
    templates[id] = {
      type:'text', text:LABEL_TEXTS_MAP[id],
      x: Math.round(cx - 60), y: Math.round(cy - fontSize / 2),
      color:COLORS.ORANGE, fontSize
    };
  });

  // Nummern 1–12: unten mittig
  for (let i = 1; i <= 12; i++) {
    templates[`text_number_${i}`] = {
      type:'text', text:String(i),
      x: Math.round(cx - 15), y: Math.round(canvasHeight - 80),
      color:COLORS.ORANGE, fontSize:numberFontSize
    };
  }

  return templates[type] ? { ...templates[type] } : null;
}
