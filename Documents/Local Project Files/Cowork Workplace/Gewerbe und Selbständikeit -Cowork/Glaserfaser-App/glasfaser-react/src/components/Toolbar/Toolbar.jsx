/**
 * MODUL 2: HTML-LAYOUT — Toolbar (linke Spalte)
 * Alle Zeichen-Werkzeuge, Beschriftungen, Gebäude-Labels-Generator
 */
import React, { useState } from 'react';
import { COLORS } from '../../constants';

export default function Toolbar({
  selectToolActive,
  onToggleSelectTool,
  onAddElement,
  onStartPencil,
  pencilMode,
  onOpenTextModal,
  onInsertBuildingLabels,
  onAdjustBuildingSpacing,
  onFinalizeBuildingLabels,
  activeBuildingGroupId,
}) {
  const [floors, setFloors] = useState(3);
  const [aptsPerFloor, setAptsPerFloor] = useState(2);

  return (
    <aside style={styles.toolbar}>

      {/* AUSWAHL-WERKZEUG */}
      <section style={styles.section}>
        <button
          style={{ ...styles.selectBtn, ...(selectToolActive ? styles.selectBtnActive : {}) }}
          onClick={onToggleSelectTool}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3l14 9-7 1-4 6z"/>
          </svg>
          Auswahl
        </button>
      </section>

      {/* LINIEN */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>Linien</div>
        <div style={styles.grid2}>
          <IconBtn label="Blau" onClick={() => onAddElement('line_blue')}>
            <svg viewBox="0 0 40 22" fill="none"><line x1="4" y1="18" x2="36" y2="4" stroke={COLORS.BLUE} strokeWidth="3.5" strokeLinecap="round"/></svg>
          </IconBtn>
          <IconBtn label="Lila" onClick={() => onAddElement('line_purple')}>
            <svg viewBox="0 0 40 22" fill="none"><line x1="4" y1="18" x2="36" y2="4" stroke={COLORS.PURPLE} strokeWidth="3.5" strokeLinecap="round"/></svg>
          </IconBtn>
          <IconBtn label="Blau + 🟠" onClick={() => onAddElement('line_blue_yellow')}>
            <svg viewBox="0 0 44 24" fill="none"><line x1="3" y1="20" x2="29" y2="7" stroke={COLORS.BLUE} strokeWidth="3" strokeLinecap="round"/><circle cx="37" cy="7" r="6.5" stroke={COLORS.ORANGE} strokeWidth="2.5"/></svg>
          </IconBtn>
          <IconBtn label="Blau + 🔴" onClick={() => onAddElement('line_blue_red')}>
            <svg viewBox="0 0 44 24" fill="none"><line x1="3" y1="20" x2="29" y2="7" stroke={COLORS.BLUE} strokeWidth="3" strokeLinecap="round"/><circle cx="37" cy="7" r="6.5" stroke={COLORS.RED} strokeWidth="2.5"/></svg>
          </IconBtn>
          <IconBtn label="Lila + 🟠" onClick={() => onAddElement('line_purple_yellow')}>
            <svg viewBox="0 0 44 24" fill="none"><line x1="3" y1="20" x2="29" y2="7" stroke={COLORS.PURPLE} strokeWidth="3" strokeLinecap="round"/><circle cx="37" cy="7" r="6.5" stroke={COLORS.ORANGE} strokeWidth="2.5"/></svg>
          </IconBtn>
          <IconBtn label="Lila + 🔴" onClick={() => onAddElement('line_purple_red')}>
            <svg viewBox="0 0 44 24" fill="none"><line x1="3" y1="20" x2="29" y2="7" stroke={COLORS.PURPLE} strokeWidth="3" strokeLinecap="round"/><circle cx="37" cy="7" r="6.5" stroke={COLORS.RED} strokeWidth="2.5"/></svg>
          </IconBtn>
        </div>
      </section>

      {/* ZICKZACK */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>Zickzack-Linie</div>
        <div style={styles.grid2}>
          <IconBtn
            label="✏️ Blau"
            onClick={() => onStartPencil('blue')}
            active={pencilMode?.color === 'blue'}
          >
            <svg viewBox="0 0 44 26" fill="none"><polyline points="3,22 12,6 20,18 30,6 40,18" stroke={COLORS.BLUE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </IconBtn>
          <IconBtn
            label="✏️ Lila"
            onClick={() => onStartPencil('purple')}
            active={pencilMode?.color === 'purple'}
          >
            <svg viewBox="0 0 44 26" fill="none"><polyline points="3,22 12,6 20,18 30,6 40,18" stroke={COLORS.PURPLE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </IconBtn>
        </div>
      </section>

      {/* KREISE */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>Kreise (transparent)</div>
        <div style={styles.grid2}>
          <IconBtn label="🟠 Kreis" onClick={() => onAddElement('circle_yellow')}>
            <svg viewBox="0 0 40 28" fill="none"><circle cx="20" cy="14" r="10" stroke={COLORS.ORANGE} strokeWidth="3"/></svg>
          </IconBtn>
          <IconBtn label="🔴 Kreis" onClick={() => onAddElement('circle_red')}>
            <svg viewBox="0 0 40 28" fill="none"><circle cx="20" cy="14" r="10" stroke={COLORS.RED} strokeWidth="3"/></svg>
          </IconBtn>
        </div>
      </section>

      {/* RECHTECKE */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>Rechtecke</div>
        <div style={styles.grid3}>
          <IconBtn label="Splitter" onClick={() => onAddElement('rect_large_yellow')}>
            <svg viewBox="0 0 40 28" fill="none"><rect x="5" y="4" width="30" height="20" stroke={COLORS.ORANGE} strokeWidth="3" rx="1.5"/></svg>
          </IconBtn>
          <IconBtn label="GFTA H" onClick={() => onAddElement('gfta_horizontal')}>
            <svg viewBox="0 0 40 28" fill="none">
              <rect x="2" y="6" width="16" height="16" stroke={COLORS.RED} strokeWidth="2.5" rx="1"/>
              <rect x="22" y="6" width="16" height="16" stroke={COLORS.RED} strokeWidth="2.5" rx="1"/>
            </svg>
          </IconBtn>
          <IconBtn label="GFTA V" onClick={() => onAddElement('gfta_vertical')}>
            <svg viewBox="0 0 40 30" fill="none">
              <rect x="10" y="2" width="20" height="11" stroke={COLORS.RED} strokeWidth="2.5" rx="1"/>
              <rect x="10" y="17" width="20" height="11" stroke={COLORS.RED} strokeWidth="2.5" rx="1"/>
            </svg>
          </IconBtn>
        </div>
      </section>

      {/* NUMMERN */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>Nummern</div>
        <div style={styles.grid4}>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
            <button key={n} style={styles.numBtn} onClick={() => onAddElement(`text_number_${n}`)}>
              {n}
            </button>
          ))}
        </div>
      </section>

      {/* BESCHRIFTUNGEN — 2-spaltig kompakt */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>Beschriftungen</div>
        <div style={styles.grid2}>
          {[
            ['text_zu_eg','Zu EG'],['text_zu_1og','Zu 1.OG'],
            ['text_zu_2og','Zu 2.OG'],['text_zu_treppe','Treppe'],
            ['text_linke_kamine','L. Kamine'],['text_rechte_kamine','R. Kamine'],
            ['text_zu_linke_kamine','Zu L.K.'],['text_zu_rechte_kamine','Zu R.K.'],
            ['text_baugleich','Baugleich'],
          ].map(([id, label]) => (
            <button key={id} style={styles.textBtn} onClick={() => onAddElement(id)}>
              {label}
            </button>
          ))}
          <button style={{ ...styles.textBtn, ...styles.textBtnSpecial, gridColumn: 'span 2' }} onClick={onOpenTextModal}>
            ✏️ Eigener Text …
          </button>
        </div>
      </section>

      {/* GEBÄUDE-LABELS-GENERATOR */}
      <section style={styles.section}>
        <div style={styles.sectionTitle}>Gebäude-Labels</div>
        <div style={styles.buildingRow}>
          <span style={styles.buildingLabel}>Etagen:</span>
          <input type="number" min={0} max={10} value={floors}
            onChange={e => setFloors(Number(e.target.value))} style={styles.spinner}/>
        </div>
        <div style={{ ...styles.buildingRow, marginTop: 4 }}>
          <span style={styles.buildingLabel}>Whg./Etage:</span>
          <input type="number" min={1} max={10} value={aptsPerFloor}
            onChange={e => setAptsPerFloor(Number(e.target.value))} style={styles.spinner}/>
        </div>
        <button style={styles.insertBtn} onClick={() => onInsertBuildingLabels(floors, aptsPerFloor)}>
          🏢 Labels einfügen
        </button>
        {activeBuildingGroupId && (
          <>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#a0a0a5', textTransform: 'uppercase', letterSpacing: '0.7px', margin: '6px 0 3px', paddingBottom: 3, borderBottom: '1px solid #f0f0f2' }}>Abstände</div>
            <div style={styles.grid4}>
              <button style={styles.spacingBtn} onClick={() => onAdjustBuildingSpacing('h', -1)}>H−</button>
              <button style={styles.spacingBtn} onClick={() => onAdjustBuildingSpacing('h',  1)}>H+</button>
              <button style={styles.spacingBtn} onClick={() => onAdjustBuildingSpacing('v', -1)}>V−</button>
              <button style={styles.spacingBtn} onClick={() => onAdjustBuildingSpacing('v',  1)}>V+</button>
            </div>
            <button style={styles.finishBtn} onClick={onFinalizeBuildingLabels}>
              ✓ Fertig – Labels sperren
            </button>
          </>
        )}
      </section>

    </aside>
  );
}

/* ── Hilfskomponenten ── */
function IconBtn({ label, onClick, active, children }) {
  return (
    <button
      onClick={onClick}
      style={{ ...styles.iconBtn, ...(active ? styles.iconBtnActive : {}) }}
    >
      <div style={{ width: 40, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {React.cloneElement(children, { style: { width: 40, height: 26, display: 'block' } })}
      </div>
      <span style={{ ...styles.iconLabel, ...(active ? { color: '#007AFF' } : {}) }}>{label}</span>
    </button>
  );
}

/* ── Styles ── */
const styles = {
  toolbar: { width: 230, background: 'white', borderRight: '1px solid #e8e8ea', overflowY: 'auto', overflowX: 'hidden', padding: '10px 9px', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 },
  section: { display: 'flex', flexDirection: 'column', gap: 4 },
  sectionTitle: { fontWeight: 700, fontSize: 9, color: '#a0a0a5', textTransform: 'uppercase', letterSpacing: '0.9px', padding: '0 2px 4px', borderBottom: '1px solid #f0f0f2', marginBottom: 1 },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 3 },
  selectBtn: { width: '100%', padding: '8px 12px', minHeight: 40, border: '1.5px solid #e8e8ea', borderRadius: 10, background: 'white', fontSize: 12, fontWeight: 700, color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.15s', marginBottom: 2 },
  selectBtnActive: { background: '#EFF6FF', borderColor: '#007AFF', color: '#007AFF' },
  iconBtn: { padding: '5px 3px', minHeight: 52, border: '1.5px solid #e8e8ea', borderRadius: 10, background: 'white', cursor: 'pointer', transition: 'all 0.14s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 },
  iconBtnActive: { background: '#EFF6FF', borderColor: '#007AFF' },
  iconLabel: { fontSize: 9, fontWeight: 600, color: '#888', lineHeight: 1 },
  numBtn: { padding: '4px 2px', minHeight: 36, border: '1.5px solid #e8e8ea', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#1a1a1a', transition: 'all 0.14s' },
  textBtn: { padding: '7px 9px', minHeight: 34, border: '1.5px solid #e8e8ea', borderRadius: 8, background: 'white', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#1a1a1a', textAlign: 'left', transition: 'all 0.14s', display: 'flex', alignItems: 'center' },
  textBtnSpecial: { background: '#FFFBEB', borderColor: '#F5A623', color: '#A06800' },
  buildingRow: { display: 'flex', alignItems: 'center', gap: 4, width: '100%' },
  buildingLabel: { fontSize: 10, fontWeight: 600, color: '#555', whiteSpace: 'nowrap', flexShrink: 0, minWidth: 70 },
  spinner: { width: 44, height: 32, border: '1.5px solid #e8e8ea', borderRadius: 7, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#1a1a1a', background: 'white', outline: 'none' },
  insertBtn: { width: '100%', padding: 9, minHeight: 38, border: '1.5px solid #007AFF', borderRadius: 9, background: '#EFF6FF', color: '#007AFF', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 2 },
  spacingBtn: { padding: '5px 2px', minHeight: 30, border: '1.5px solid #e8e8ea', borderRadius: 7, background: 'white', fontSize: 12, fontWeight: 700, color: '#333', cursor: 'pointer' },
  finishBtn: { width: '100%', padding: 8, minHeight: 36, border: '1.5px solid #34C759', borderRadius: 9, background: '#EDFFF2', color: '#1A7A35', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 3 },
};
