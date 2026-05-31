#!/bin/bash
# ============================================================
# Glasfaser v8 — Ein-Klick Deploy zu GitHub + Vercel
# Doppelklick auf diese Datei → automatisch pushen
# ============================================================

cd "$(dirname "$0")"

echo ""
echo "🌐 Glasfaser — Automatik-Deploy"
echo "================================"
echo ""

# Git-Repository prüfen
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "❌ Kein Git-Repository gefunden."
  echo "   Bitte zuerst einmalig im Terminal ausführen:"
  echo "   git init && git remote add origin DEINE_GITHUB_URL"
  echo ""
  read -p "Drücke Enter zum Schließen..."
  exit 1
fi

# Änderungen prüfen
CHANGES=$(git status --porcelain)
if [ -z "$CHANGES" ]; then
  echo "✅ Keine Änderungen — alles ist bereits aktuell auf GitHub."
  echo ""
  read -p "Drücke Enter zum Schließen..."
  exit 0
fi

# Geänderte Dateien anzeigen
echo "📝 Geänderte Dateien:"
git status --short
echo ""

# Commit-Nachricht mit Datum/Uhrzeit
TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
MSG="v8: Auto-Deploy ${TIMESTAMP}"

git add .
git commit -m "$MSG"

if git push origin main; then
  echo ""
  echo "✅ Erfolgreich gepusht!"
  echo "🚀 Vercel startet jetzt automatisch das neue Deployment..."
  echo "   → https://app-gl-uj5h.vercel.app"
  echo ""
else
  echo ""
  echo "❌ Push fehlgeschlagen. GitHub-Verbindung prüfen."
  echo ""
fi

read -p "Drücke Enter zum Schließen..."
