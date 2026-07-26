$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$logPath = Join-Path $PSScriptRoot 'chronorail-server.log'

function Test-PortAvailable([int]$Port) {
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
  try {
    $listener.Start()
    return $true
  } catch {
    return $false
  } finally {
    try { $listener.Stop() } catch {}
  }
}

try {
  "[$(Get-Date -Format s)] ChronoRail başlatılıyor" | Set-Content -LiteralPath $logPath -Encoding UTF8

  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) { throw 'Node.js bulunamadı. Node.js 20 veya daha yeni bir sürüm kur.' }

  $versionText = (& node -p "process.versions.node").Trim()
  $major = [int]($versionText.Split('.')[0])
  if ($major -lt 20) { throw "Node.js 20+ gerekli. Mevcut sürüm: $versionText" }

  & node scripts/verify-installation.mjs 2>&1 | Tee-Object -FilePath $logPath -Append
  if ($LASTEXITCODE -ne 0) { throw 'Kurulum dosyaları eksik veya yanlış klasörde.' }

  if ($env:PORT) {
    $port = [int]$env:PORT
  } else {
    $port = 8080
    while (-not (Test-PortAvailable $port)) {
      Write-Host "Port $port kullanımda; sonraki port deneniyor..." -ForegroundColor Yellow
      $port++
      if ($port -gt 8180) { throw '8080-8180 arasında boş port bulunamadı.' }
    }
  }
  $env:PORT = [string]$port
  $url = "http://localhost:$port"

  Write-Host ''
  Write-Host "ChronoRail sunucusu başlatılıyor: $url" -ForegroundColor Cyan
  Write-Host "Bu pencere açık kalmalı. Durdurmak için Ctrl+C kullan." -ForegroundColor Gray
  Write-Host "Log: $logPath" -ForegroundColor Gray
  Write-Host ''

  Start-Job -ScriptBlock {
    param($HealthUrl, $GameUrl)
    for ($i = 0; $i -lt 100; $i++) {
      try {
        $response = Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 $HealthUrl
        if ($response.StatusCode -eq 200) {
          Start-Process $GameUrl
          break
        }
      } catch {}
      Start-Sleep -Milliseconds 250
    }
  } -ArgumentList "$url/healthz", $url | Out-Null

  & node server.mjs 2>&1 | Tee-Object -FilePath $logPath -Append
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) { throw "Node sunucusu hata koduyla kapandı: $exitCode" }
  exit 0
} catch {
  $message = $_.Exception.Message
  Write-Host ''
  Write-Host "[HATA] $message" -ForegroundColor Red
  "[$(Get-Date -Format s)] HATA: $message" | Add-Content -LiteralPath $logPath -Encoding UTF8
  Write-Host "Ayrıntılar: $logPath" -ForegroundColor Yellow
  exit 1
}
