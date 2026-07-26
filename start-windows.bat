@echo off
setlocal
cd /d "%~dp0"
title ChronoRail Sunucusu

if not exist "server.mjs" (
  echo [HATA] server.mjs bulunamadi.
  echo ZIP dosyasini tamamen cikart ve bu dosyayi cikartilan klasorden calistir.
  echo.
  pause
  exit /b 1
)

powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-windows.ps1"
set "EXIT_CODE=%ERRORLEVEL%"

echo.
if not "%EXIT_CODE%"=="0" echo [HATA] Sunucu %EXIT_CODE% koduyla kapandi.
echo Ayrintilar chronorail-server.log dosyasina yazildi.
echo Bu pencereyi kapatmak icin bir tusa basin.
pause >nul
exit /b %EXIT_CODE%
