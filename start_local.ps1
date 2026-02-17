Write-Host "Stopping any existing Node.js processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 1. Start Backend in a new window
Write-Host "Launching Backend on Port 8080..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; $env:DISABLE_GCP_SERVICES='true'; npm run dev"

# Wait a moment for backend to initialize
Start-Sleep -Seconds 5

# 2. Start Frontend in a new window
Write-Host "Launching Frontend on Port 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "--------------------------------------------------" -ForegroundColor Yellow
Write-Host "Backend: http://localhost:8080"
Write-Host "Frontend: http://localhost:3000"
Write-Host "--------------------------------------------------" -ForegroundColor Yellow
Write-Host "Please open http://localhost:3000 in your browser." -ForegroundColor Cyan
