@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo [HATA] Node.js bulunamadi. Node.js 20 veya daha yeni bir surum kur.
  echo https://nodejs.org/
  pause
  exit /b 1
)
for /f "tokens=1 delims=." %%V in ('node -p "process.versions.node"') do set NODE_MAJOR=%%V
if %NODE_MAJOR% LSS 20 (
  echo [HATA] Node.js 20 veya daha yeni olmali. Mevcut surum:
  node -v
  pause
  exit /b 1
)
start "" /b powershell -NoProfile -WindowStyle Hidden -Command "$ok=$false; for($i=0;$i -lt 60;$i++){ try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 'http://127.0.0.1:8080/healthz'; if($r.StatusCode -eq 200){$ok=$true; break} } catch {}; Start-Sleep -Milliseconds 250 }; if($ok){Start-Process 'http://localhost:8080'}"
echo ChronoRail sunucusu baslatiliyor...
echo Bu pencere acik kalmali. Oyunu kapatmak icin Ctrl+C kullan.
node server.mjs
if errorlevel 1 (
  echo.
  echo Sunucu baslatilamadi. Yukaridaki hata mesajini kontrol et.
)
pause
