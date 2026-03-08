@echo off
echo Starting AgriGuard AI Backend...
echo.
echo Make sure you're in the backend directory
cd /d "%~dp0"
echo Server starting at http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.
uvicorn app.main:app --host localhost --port 8000 --reload
pause

