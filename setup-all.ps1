# Complete Setup Script
# Employee Task Performance & Productivity Tracker

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Application Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install root dependencies
Write-Host "📦 Step 1/4: Installing root dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install root dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Root dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Install backend dependencies
Write-Host "📦 Step 2/4: Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 3: Install frontend dependencies
Write-Host "📦 Step 3/4: Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 4: Check .env file
Write-Host "🔧 Step 4/4: Checking configuration..." -ForegroundColor Yellow
if (Test-Path "backend/.env") {
    Write-Host "✅ Configuration file exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  Warning: backend/.env not found" -ForegroundColor Yellow
    Write-Host "   Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item "backend/.env.example" "backend/.env"
    Write-Host "✅ Configuration file created" -ForegroundColor Green
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete! ✅" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Create database: mysql -u root -p -P 3308" -ForegroundColor White
Write-Host "   Then run: CREATE DATABASE IF NOT EXISTS employee_tracker;" -ForegroundColor White
Write-Host ""
Write-Host "2. Seed database: cd backend && npm run seed && cd .." -ForegroundColor White
Write-Host ""
Write-Host "3. Start backend: npm run backend" -ForegroundColor White
Write-Host ""
Write-Host "4. Start frontend (new terminal): npm run frontend" -ForegroundColor White
Write-Host ""
Write-Host "Or see QUICK_START.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
