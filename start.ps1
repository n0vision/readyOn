# ==============================================================================
#  readyOn - Полный скрипт запуска (Авто-режим: Local / Docker Compose)
# ==============================================================================
param (
    [switch]$Docker,
    [switch]$NoTunnel
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "          🚀 readyOn - Запуск всех сервисов           " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $rootPath

# Проверяем наличие Docker, если запрошен флаг -Docker
$hasDocker = $false
try {
    $null = Get-Command docker -ErrorAction Stop
    $hasDocker = $true
} catch {
    $hasDocker = $false
}

if ($Docker -and -not $hasDocker) {
    Write-Host "⚠️ Docker не найден в системе. Переключаюсь на локальный режим..." -ForegroundColor Yellow
    $Docker = $false
}

# ------------------------------------------------------------------------------
# РЕЖИМ 1: DOCKER COMPOSE
# ------------------------------------------------------------------------------
if ($Docker) {
    Write-Host "🐳 Запуск через Docker Compose..." -ForegroundColor Magenta
    docker compose up -d --build
    
    Write-Host ""
    Write-Host "✅ Все сервисы запущены в Docker!" -ForegroundColor Green
    Write-Host "   • Web (Mini App):  http://localhost:5173"
    Write-Host "   • API Server:      http://localhost:3000"
    Write-Host "   • PostgreSQL:      localhost:5432"
    Write-Host "   • Redis:           localhost:6379"
    Write-Host ""
    Write-Host "ℹ️ Для получения ссылки Cloudflare Tunnel выполните:" -ForegroundColor Gray
    Write-Host "   docker logs -f readyon-tunnel" -ForegroundColor White
    exit 0
}

# ------------------------------------------------------------------------------
# РЕЖИМ 2: ЛОКАЛЬНЫЙ ЗАПУСК (PostgreSQL, Redis, Vite, Cloudflare, Server/Bot)
# ------------------------------------------------------------------------------

# 1. Настройка PATH для Scoop
$pgBin = "$env:USERPROFILE\scoop\apps\postgresql\current\bin"
$pgData = "$env:USERPROFILE\scoop\apps\postgresql\current\data"
$redisBin = "$env:USERPROFILE\scoop\apps\redis\current"
$shimsBin = "$env:USERPROFILE\scoop\shims"

$env:Path = "$pgBin;$redisBin;$shimsBin;" + [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')

# 2. Проверка и запуск PostgreSQL (порт 5432)
$pgRunning = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
if (-not $pgRunning) {
    Write-Host "🐘 [1/5] Запуск PostgreSQL..." -ForegroundColor Cyan
    if (Test-Path "$pgBin\postgres.exe") {
        Start-Process "$pgBin\postgres.exe" -ArgumentList "-D `"$pgData`"" -WindowStyle Hidden
        Start-Sleep -Seconds 2
        Write-Host "   ✅ PostgreSQL запущен на порту 5432" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Не найден postgres.exe в Scoop. Проверьте путь $pgBin" -ForegroundColor Yellow
    }
} else {
    Write-Host "🐘 [1/5] PostgreSQL уже работает (порт 5432)" -ForegroundColor Green
}

# 3. Проверка и запуск Redis (порт 6379)
$redisRunning = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue
if (-not $redisRunning) {
    Write-Host "📦 [2/5] Запуск Redis..." -ForegroundColor Cyan
    if (Test-Path "$redisBin\redis-server.exe") {
        Start-Process "$redisBin\redis-server.exe" -WindowStyle Hidden
        Start-Sleep -Seconds 1
        Write-Host "   ✅ Redis запущен на порту 6379" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Не найден redis-server.exe в Scoop. Проверьте путь $redisBin" -ForegroundColor Yellow
    }
} else {
    Write-Host "📦 [2/5] Redis уже работает (порт 6379)" -ForegroundColor Green
}

# 4. Проверка и запуск Vite (порт 5173)
$viteRunning = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if (-not $viteRunning) {
    Write-Host "⚡ [3/5] Запуск Vite Dev Server (Mini App Frontend)..." -ForegroundColor Cyan
    $webDir = Join-Path $rootPath "apps\web"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$webDir'; pnpm run dev" -WindowStyle Minimized
    Start-Sleep -Seconds 3
    Write-Host "   ✅ Vite запущен на http://localhost:5173" -ForegroundColor Green
} else {
    Write-Host "⚡ [3/5] Vite Dev Server уже работает (порт 5173)" -ForegroundColor Green
}

# 5. Cloudflare Tunnel (HTTPS для Telegram Mini App)
$tunnelUrl = ""
if (-not $NoTunnel) {
    Write-Host "🌐 [4/5] Подключение Cloudflare Tunnel..." -ForegroundColor Cyan
    
    # Временный лог для получения URL
    $cfLog = Join-Path $env:TEMP "cloudflared-readyon.log"
    if (Test-Path $cfLog) { Remove-Item -Force $cfLog }

    Start-Process powershell -ArgumentList "-WindowStyle Hidden", "-Command", "cloudflared tunnel --protocol http2 --url http://localhost:5173 2> '$cfLog'" -WindowStyle Hidden
    
    # Ожидаем появления ссылки в логе
    $timeout = 15
    for ($i = 0; $i -lt $timeout; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Path $cfLog) {
            $match = Get-Content $cfLog -ErrorAction SilentlyContinue | Select-String "https://[a-zA-Z0-9-]+\.trycloudflare\.com"
            if ($match) {
                $tunnelUrl = $match.Matches[0].Value
                break
            }
        }
    }

    if ($tunnelUrl) {
        Write-Host "   ✅ Cloudflare Tunnel подключен: $tunnelUrl" -ForegroundColor Green
        
        # Обновляем .env в apps/server
        $envPath = Join-Path $rootPath "apps\server\.env"
        if (Test-Path $envPath) {
            $content = Get-Content $envPath -Raw
            if ($content -match 'MINI_APP_URL=".*"') {
                $content = $content -replace 'MINI_APP_URL=".*"', "MINI_APP_URL=`"$tunnelUrl`""
            } else {
                $content += "`nMINI_APP_URL=`"$tunnelUrl`""
            }
            Set-Content $envPath $content -NoNewline
            Write-Host "   ✅ MINI_APP_URL обновлен в apps/server/.env" -ForegroundColor Green
        }
    } else {
        Write-Host "   ⚠️ Не удалось автоматически прочитать URL туннеля за $timeout сек." -ForegroundColor Yellow
        Write-Host "   (Туннель запущен в фоне, проверьте при необходимости)" -ForegroundColor Gray
    }
} else {
    Write-Host "🌐 [4/5] Cloudflare Tunnel пропущен (флаг -NoTunnel)" -ForegroundColor Gray
}

# 6. Проверка и запуск Backend API Server + Telegram Bot (порт 3000)
$serverRunning = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if (-not $serverRunning) {
    Write-Host "🤖 [5/5] Запуск ReadyOn Server & Telegram Bot..." -ForegroundColor Cyan
    $serverDir = Join-Path $rootPath "apps\server"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$serverDir'; pnpm run dev" -WindowStyle Normal
    Start-Sleep -Seconds 3
    Write-Host "   ✅ Сервер и бот запущены на http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "🤖 [5/5] ReadyOn Server & Telegram Bot уже работает (порт 3000)" -ForegroundColor Green
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "           🎉 ВСЕ СЕРВИСЫ УСПЕШНО РАБОТАЮТ!           " -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host " • Telegram Бот:     https://t.me/readyOnCS_bot" -ForegroundColor Cyan
Write-Host " • Mini App (Local): http://localhost:5173" -ForegroundColor Cyan
if ($tunnelUrl) {
    Write-Host " • Mini App (HTTPS): $tunnelUrl" -ForegroundColor Cyan
}
Write-Host " • API Сервер:       http://localhost:3000" -ForegroundColor Cyan
Write-Host " • База данных:      PostgreSQL (5432)" -ForegroundColor Gray
Write-Host " • Кэш / Сессии:     Redis (6379)" -ForegroundColor Gray
Write-Host "======================================================" -ForegroundColor Green
Write-Host "Для остановки всех сервисов запустите: .\stop.ps1" -ForegroundColor Yellow
Write-Host ""
