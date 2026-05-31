# Snapshots — Glasfaser React

Jeder Ordner hier ist ein vollständiger Sicherungsstand von `src/`.

## Struktur
```
snapshots/
  2026-05-31_v8.0_initial/     ← erster stabiler Stand
    src/                        ← komplette Kopie von src/
    INFO.md                     ← was war in dieser Version
  2026-06-01_vor-neue-funktion/
    src/
    INFO.md
```

## Snapshot erstellen
→ Doppelklick auf `create-snapshot.command`

## Funktion aus altem Snapshot wiederherstellen
Claude sagen: "Schau in snapshots/2026-05-31_v8.0_initial — 
die Lasso-Funktion in ImageCanvas.jsx war dort besser."

## Git-Tags (auf GitHub sichtbar)
Jeder Snapshot erstellt auch einen Git-Tag → 
auf GitHub unter "Releases/Tags" sichtbar.
