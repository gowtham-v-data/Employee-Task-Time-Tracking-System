# Start Backend Server
# Employee Task Performance & Productivity Tracker

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Backend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-Not (Test-Path "backend/.env")) {
    Write-Host "❌ Error: backend/.env file not found!" -ForegroundColor Red
    Write-Host "Please create backend/.env file from backend/.env.example" -ForegroundColor Yellow
    exit 1
}

# Navigate to backend directory
Set-Location backend

Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "🚀 Starting backend server on http://localhost:5000" -ForegroundColor Green
Write-Host "📊 Health check: http://localhost:5000/health" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
npm start
