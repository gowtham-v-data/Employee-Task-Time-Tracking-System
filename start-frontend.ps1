# Start Frontend Server
# Employee Task Performance & Productivity Tracker

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Frontend Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to frontend directory
Set-Location frontend

Write-Host "📦 Checking dependencies..." -ForegroundColor Yellow
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "🚀 Starting frontend server on http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Make sure backend is running on http://localhost:5000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
npm run dev
