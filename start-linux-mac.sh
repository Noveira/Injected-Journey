#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "HATA: Node.js 20 veya daha yeni bir sürüm gerekli."
  exit 1
fi
major="$(node -p "process.versions.node.split('.')[0]")"
if [ "$major" -lt 20 ]; then
  echo "HATA: Node.js 20 veya daha yeni olmalı. Mevcut: $(node -v)"
  exit 1
fi
(
  i=0
  while [ "$i" -lt 60 ]; do
    if command -v curl >/dev/null 2>&1 && curl -fsS http://127.0.0.1:8080/healthz >/dev/null 2>&1; then
      if command -v open >/dev/null 2>&1; then open http://localhost:8080 >/dev/null 2>&1 || true
      elif command -v xdg-open >/dev/null 2>&1; then xdg-open http://localhost:8080 >/dev/null 2>&1 || true
      fi
      exit 0
    fi
    i=$((i+1)); sleep 0.25
  done
) &
echo "ChronoRail sunucusu başlatılıyor. Bu terminal açık kalmalı."
node server.mjs
