@echo off
cd /d c:\Users\nouma\Desktop\AgriGurad-AI-2.0\backend
python -m uvicorn app.main:app --host localhost --port 8000 --reload
pause

