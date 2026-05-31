#!/bin/bash
# ============================================================
# Glasfaser React — Snapshot erstellen
# Doppelklick → fragt nach Beschreibung → sichert src/ + Git-Tag
# ============================================================

cd "$(dirname "$0")"

echo ""
echo "📸 Glasfaser — Snapshot erstellen"
echo "=================================="
echo ""

# Beschreibung abfragen
read -p "Beschreibung (z.B. 'vor-lasso-fix' oder 'v9.0-stabil'): " DESC

if [ -z "$DESC" ]; then
  echo "❌ Keine Beschreibung eingegeben — abgebrochen."
  read -p "Enter zum Schließen..."; exit 1
fi

DATE=$(date +"%Y-%m-%d")
TIME=$(date +"%H-%M")
FOLDER="snapshots/${DATE}_${DESC}"

# src/ kopieren
mkdir -p "$FOLDER/src"
cp -r src/* "$FOLDER/src/"

# INFO.md schreiben
COMMITS=$(git log --oneline -5 2>/dev/null || echo "kein git")
cat > "$FOLDER/INFO.md" << EOF
# Snapshot: $DESC
**Datum:** $DATE $TIME
**Beschreibung:** $DESC

## Letzte Commits zum Zeitpunkt des Snapshots:
$COMMITS
EOF

echo ""
echo "✅ Snapshot gesichert: $FOLDER"

# Git-Tag erstellen
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  TAG=$(echo "$DESC" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')
  git tag "$TAG" 2>/dev/null && echo "🏷  Git-Tag erstellt: $TAG" \
    || echo "⚠️  Tag '$TAG' existiert bereits — Snapshot trotzdem gespeichert"
  git push origin "$TAG" --quiet 2>/dev/null && echo "📤 Tag auf GitHub gepusht"
fi

echo ""
echo "Snapshots verfügbar in: snapshots/"
ls snapshots/ | tail -10
echo ""
read -p "Enter zum Schließen..."
