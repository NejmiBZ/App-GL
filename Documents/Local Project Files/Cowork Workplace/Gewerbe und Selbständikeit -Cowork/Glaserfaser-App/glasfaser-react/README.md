# Glasfaser Hausbegehung App — React Version

> **Entwicklungsversion** — Vite + React + react-konva

## Starten

```bash
cd glasfaser-react
npm install
npm run dev
```

Dann im Browser öffnen: `http://localhost:5173`

## Build (für Offline-Nutzung)

```bash
npm run build
```

Die fertige App liegt in `dist/` als einzelne HTML-Datei — offline nutzbar.

## Architektur

```
src/
├── constants/
│   ├── colors.js        # Farb-Konstanten (COLORS.BLUE, COLORS.ORANGE, ...)
│   ├── config.js        # App-Konfiguration (Zoom, Snap-Radius, ...)
│   └── elementTypes.js  # Element-Typen + Beschriftungs-Texte
├── utils/
│   ├── createElement.js # Modul 4: Element-Fabrik (neue Typen hier hinzufügen)
│   ├── snapUtils.js     # Modul 7: Snap & Hilfslinien
│   ├── hitDetection.js  # Modul 6: Trefferkennung
│   └── exportUtils.js   # Modul 11: ZIP/JPG-Export
├── hooks/
│   ├── useImages.js     # Modul 10: Bild-Verwaltung + Zentrale Eingangs-Funktion
│   ├── useDrawing.js    # Modul 8: Zickzack/Polyline-Modus
│   └── useExport.js     # Modul 11: Export-Hook
└── components/
    ├── Header/          # Adresse + Aktions-Buttons
    ├── Toolbar/         # Alle Werkzeuge + Gebäude-Labels-Generator (Modul 13)
    ├── Canvas/          # Bild + Zeichenfläche (react-konva)
    └── Sidebar/         # Seitenübersicht + Thumbnail-Navigation
```

## Goldene Regeln

- **Neue Beschriftung hinzufügen** → `src/constants/elementTypes.js`, Array `LABEL_TEXTS`, 1 Zeile
- **Neues Element** → `src/utils/createElement.js`, `templates`-Objekt
- **Neue Farbe** → `src/constants/colors.js`, `COLORS`-Objekt
- **Zoom beim Upload** → `src/constants/config.js`, `DEFAULT_ZOOM`
- **Seitennummer-Offset** → `src/constants/config.js`, `PAGE_NUMBER_OFFSET`

## Geplante Erweiterungen

- **Kamera-Funktion**: `processNewImage()` in `useImages.js` ist die zentrale Eingangs-Funktion. Kamera-Aufnahme übergibt Bild an diese Funktion — keine andere Änderung nötig.
- **Cloud-Speicherung**: Export-Utils durch API ersetzen.
