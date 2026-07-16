@echo off
chcp 65001 > nul
echo ================================
echo  PlacementIQ - Starting Project
echo ================================

echo Killing existing processes on ports 8000 and 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8000 " 2^>nul') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " 2^>nul') do taskkill /F /PID %%a 2>nul

timeout /t 2 > nul

echo Starting Backend (FastAPI + MySQL)...
start "PlacementIQ Backend" cmd /k "chcp 65001 > nul && cd /d "c:\Users\ask53\OneDrive\Attachments\Desktop\senior data analyst\Campus_Placement_Analytics\backend" && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo Waiting for backend to start...
timeout /t 8 > nul

echo Starting Frontend (React + Vite)...
start "PlacementIQ Frontend" cmd /k "cd /d "c:\Users\ask53\OneDrive\Attachments\Desktop\senior data analyst\Campus_Placement_Analytics\frontend" && npm run dev"

echo Waiting for frontend to start...
timeout /t 8 > nul

echo Opening browser...
start "" "http://localhost:3000"

echo ================================
echo  Backend  : http://localhost:8000
echo  Frontend : http://localhost:3000
echo ================================
pause
