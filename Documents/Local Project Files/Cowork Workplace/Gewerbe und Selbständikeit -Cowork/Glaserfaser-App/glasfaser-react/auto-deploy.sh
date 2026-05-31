#!/bin/bash
# Glasfaser Auto-Deploy — läuft als macOS-Dienst im Hintergrund
REPO="/Users/nejmeddinebenzaida/Documents/Local Project Files/Cowork Workplace/Gewerbe und Selbständikeit -Cowork/Glaserfaser-App/glasfaser-react"
LOG="$REPO/auto-deploy.log"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG"; }

log "Auto-Deploy Dienst gestartet"

push_if_changed() {
  cd "$REPO" || return
  CHANGES=$(git status --porcelain 2>/dev/null)
  [ -z "$CHANGES" ] && return
  git add . >> "$LOG" 2>&1
  git commit -m "Auto: $(date '+%Y-%m-%d %H:%M')" --quiet >> "$LOG" 2>&1
  if git push origin main --quiet >> "$LOG" 2>&1; then
    log "Gepusht → Vercel deployed"
  else
    log "Push fehlgeschlagen"
  fi
}

# Warten bis fswatch verfügbar
while ! command -v fswatch &>/dev/null; do sleep 5; done

fswatch -o --latency 2 \
  --exclude="node_modules" \
  --exclude=".git" \
  --exclude="dist" \
  --exclude="auto-deploy.log" \
  "$REPO/src" "$REPO/public" "$REPO/package.json" "$REPO/index.html" \
  | while read -r _; do
      sleep 2
      push_if_changed
    done
