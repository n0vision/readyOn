# ==============================================================================
#  readyOn - Скрипт остановки всех сервисов (Local / Docker Compose)
# ==============================================================================

Write-Host "🛑 Остановка сервисов readyOn..." -ForegroundColor Yellow

# 1. Если запущен Docker
try {
    $null = Get-Command docker -ErrorAction Stop
    $containers = docker ps -q --filter "name=readyon" 2>$null
    if ($containers) {
        Write-Host "🐳 Остановка Docker Compose..." -ForegroundColor Magenta
        docker compose down
    }
} catch {}

# 2. Остановка Node процессов (Server & Vite)
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "🛑 Остановка Node.js (Сервер и Vite)..." -ForegroundColor Cyan
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
}

# 3. Остановка Cloudflared
$cfProcesses = Get-Process cloudflared -ErrorAction SilentlyContinue
if ($cfProcesses) {
    Write-Host "🛑 Остановка Cloudflare Tunnel..." -ForegroundColor Cyan
    Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue
}

# 4. Остановка Redis
$redisProcesses = Get-Process redis-server -ErrorAction SilentlyContinue
if ($redisProcesses) {
    Write-Host "🛑 Остановка Redis..." -ForegroundColor Cyan
    Stop-Process -Name redis-server -Force -ErrorAction SilentlyContinue
}

# 5. Остановка PostgreSQL
$pgProcesses = Get-Process postgres -ErrorAction SilentlyContinue
if ($pgProcesses) {
    Write-Host "🛑 Остановка PostgreSQL..." -ForegroundColor Cyan
    Stop-Process -Name postgres -Force -ErrorAction SilentlyContinue
}

Write-Host "✅ Все сервисы readyOn успешно остановлены!" -ForegroundColor Green
