#!/bin/bash
# ============================================================
# Glasfaser — Automatischer Datei-Watcher
# Doppelklick → läuft im Hintergrund
# Sobald du eine Datei speicherst → automatisch Push → Vercel deployed
# Kein Claude, keine Tokens, kein manueller Schritt.
# ============================================================

cd "$(dirname "$0")"

echo ""
echo "👁  Glasfaser — Auto-Watcher gestartet"
echo "======================================="
echo "Ordner: $(pwd)/src"
echo "Jede Änderung wird automatisch zu GitHub gepusht."
echo "Fenster schließen = Watcher stoppen."
echo ""

# fswatch installieren falls nicht vorhanden
if ! command -v fswatch &> /dev/null; then
  echo "⚙️  fswatch wird installiert (einmalig)..."
  if command -v brew &> /dev/null; then
    brew install fswatch
  else
    echo "❌ Homebrew nicht gefunden. Bitte installieren: https://brew.sh"
    read -p "Drücke Enter zum Schließen..."
    exit 1
  fi
fi

# Debounce: Nicht bei jeder einzelnen Datei pushen, sondern 3 Sekunden warten
LAST_PUSH=0
DEBOUNCE=3

push_changes() {
  NOW=$(date +%s)
  DIFF=$((NOW - LAST_PUSH))
  if [ $DIFF -lt $DEBOUNCE ]; then
    return  # Zu früh — warten
  fi
  LAST_PUSH=$NOW

  CHANGES=$(git status --porcelain 2>/dev/null)
  if [ -z "$CHANGES" ]; then
    return
  fi

  TIMESTAMP=$(date +"%H:%M:%S")
  echo "[$TIMESTAMP] 📤 Änderungen erkannt — pushe..."
  git add .
  git commit -m "Auto-Deploy $(date '+%Y-%m-%d %H:%M')" --quiet
  if git push origin main --quiet 2>&1; then
    echo "[$TIMESTAMP] ✅ Gepusht — Vercel deployed gerade..."
  else
    echo "[$TIMESTAMP] ❌ Push fehlgeschlagen — GitHub-Verbindung prüfen"
  fi
}

# Watcher starten — beobachtet src/, public/ und Konfigurationsdateien
fswatch -o \
  --exclude="node_modules" \
  --exclude=".git" \
  --exclude="dist" \
  --latency 2 \
  src/ public/ package.json vite.config.js index.html 2>/dev/null \
  | while read -r event; do
      push_changes
    done
