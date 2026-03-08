@echo off
echo Starting AgriGuard AI Backend...
cd /d "c:\Users\nouma\Desktop\AGRIGURD AI\backend"
echo Starting backend on http://localhost:8000
start "Backend" python -m uvicorn app.main:app --host localhost --port 8000 --reload

echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo Starting AgriGuard AI Frontend (Vite)...
cd /d "c:\Users\nouma\Desktop\AGRIGURD AI"
start "Frontend" npm run dev

echo.
echo.
echo ==========================================
echo AgriGuard AI is now running!
echo - Backend API: http://localhost:8000
echo - Frontend: http://localhost:3000
echo ==========================================
pause

