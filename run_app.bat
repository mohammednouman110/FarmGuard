@echo off
echo Starting AgriGuard AI Backend...
cd /d "c:\Users\nouma\Desktop\AgriGurad-AI-2.0\backend"
start "Backend" cmd /k "python -m uvicorn app.main:app --host localhost --port 8000"

timeout /t 3 /nobreak > nul

echo Starting AgriGuard AI Frontend...
cd /d "c:\Users\nouma\Desktop\AgriGurad-AI-2.0"
start "Frontend" cmd /k "npm run dev"

echo.
echo ==========================================
echo AgriGuard AI is now running!
echo - Backend API: http://localhost:8000
echo - Frontend: http://localhost:5173
echo ==========================================
pause
