/**
 * MODUL 4: ELEMENT-DEFINITIONEN
 * Fabrik-Funktion: Erstellt ein neues Element anhand seines Typs.
 * F3-07: GFTA 50px, F3-06: Handles über CONFIG.HANDLE_RADIUS
 */
import { COLORS, CONFIG } from '../constants';

export function createElement(type, canvasWidth, canvasHeight) {
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const lineWidth  = Math.max(4, canvasWidth / 350);
  const lineLength = Math.max(120, canvasWidth / 5);
  const circleRadius = Math.max(8, canvasWidth / 187);

  const lx1 = Math.round(cx - lineLength / 2);
  const lx2 = Math.round(cx + lineLength / 2);
  const ly  = Math.round(cy);

  const fontSize       = Math.max(22, canvasWidth / 50);
  const numberFontSize = Math.max(32, canvasWidth / 35);

  // F3-07: GFTA mit neuen Größen aus CONFIG
  const GW = CONFIG.GFTA_WIDTH;
  const GH = CONFIG.GFTA_HEIGHT;
  const GS = CONFIG.GFTA_SPACING;

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

    // ── GFTA (F3-07: 50px statt 38px) ───────────────────────
    gfta_horizontal: { type:'gfta', x1:cx-(GW+GS/2), y1:cy-GH/2, width:GW, height:GH, spacing:GS, color:COLORS.RED, lineWidth, rotation:0 },
    gfta_vertical:   { type:'gfta', x1:cx-GW/2, y1:cy-(GH+GS/2), width:GW, height:GH, spacing:GS, color:COLORS.RED, lineWidth, rotation:90 },
  };

  // Beschriftungs-Texte — kurze Labels wie in HTML v8 (F3-10: sichtbar in 2-Spalten-Grid)
  const LABELS = {
    text_zu_eg:            { text:'Zu EG' },
    text_zu_1og:           { text:'Zu 1.OG' },
    text_zu_2og:           { text:'Zu 2.OG' },
    text_zu_treppe:        { text:'Zum Treppenhaus' },
    text_linke_kamine:     { text:'Linke Kamine' },
    text_rechte_kamine:    { text:'Rechte Kamine' },
    text_zu_linke_kamine:  { text:'Zu linke Kamine' },
    text_zu_rechte_kamine: { text:'Zu rechte Kamine' },
    text_baugleich:        { text:'Baugleich' },
  };
  Object.entries(LABELS).forEach(([id, { text }]) => {
    templates[id] = {
      type:'text', text,
      x: Math.round(cx - 60), y: Math.round(cy - fontSize / 2),
      color:COLORS.ORANGE, fontSize
    };
  });

  // Nummern 1–12
  for (let i = 1; i <= 12; i++) {
    templates[`text_number_${i}`] = {
      type:'text', text:String(i),
      x: Math.round(cx - 15), y: Math.round(canvasHeight - 80),
      color:COLORS.ORANGE, fontSize:numberFontSize
    };
  }

  return templates[type] ? { ...templates[type] } : null;
}
