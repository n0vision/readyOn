# Start PostgreSQL if not running
$pgData = "$env:USERPROFILE\scoop\apps\postgresql\current\data"
$pgBin = "$env:USERPROFILE\scoop\apps\postgresql\current\bin"
$redisBin = "$env:USERPROFILE\scoop\apps\redis\current"

$env:Path = "$pgBin;$redisBin;$env:USERPROFILE\scoop\shims;" + [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')

# Check Postgres port
$pgRunning = Get-NetTCPConnection -LocalPort 5432 -ErrorAction SilentlyContinue
if (-not $pgRunning) {
    Write-Host "🐘 Starting PostgreSQL..." -ForegroundColor Cyan
    Start-Process "$pgBin\postgres.exe" -ArgumentList "-D `"$pgData`"" -WindowStyle Hidden
    Start-Sleep -Seconds 2
} else {
    Write-Host "🐘 PostgreSQL is already running." -ForegroundColor Green
}

# Check Redis port
$redisRunning = Get-NetTCPConnection -LocalPort 6379 -ErrorAction SilentlyContinue
if (-not $redisRunning) {
    Write-Host "📦 Starting Redis..." -ForegroundColor Cyan
    Start-Process "$redisBin\redis-server.exe" -WindowStyle Hidden
    Start-Sleep -Seconds 1
} else {
    Write-Host "📦 Redis is already running." -ForegroundColor Green
}

Write-Host "🚀 Launching readyOn (Server + Web)..." -ForegroundColor Yellow
pnpm dev
