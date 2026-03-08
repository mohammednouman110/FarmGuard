# AgriGuard AI Backend

## How to Run the Server

### ⚠️ Important: Use Correct URL in Browser

When running the backend, use these URLs in your browser:
- **Correct:** http://localhost:8000
- **Correct:** http://127.0.0.1:8000
- **Wrong:** http://0.0.0.0:8000 ❌

### Option 1: Using the start.bat script (Windows)

```bash
cd backend
start.bat
```

Or manually run:
```bash
cd backend
uvicorn app.main:app --host localhost --port 8000 --reload
```

### Option 2: Using Python directly

```bash
cd backend
python -m uvicorn app.main:app --host localhost --port 8000 --reload
```

### Option 3: Using VSCode terminal

```bash
cd backend
uvicorn app.main:app --host localhost --port 8000 --reload
```

## After Starting

Once the server is running, open your browser and go to:
- **API Home:** http://localhost:8000
- **API Docs (Swagger):** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

## Troubleshooting

If you see `ERR_ADDRESS_INVALID`:
1. Make sure the server is running (you should see "Uvicorn running on http://localhost:8000")
2. Use `localhost` or `127.0.0.1` instead of `0.0.0.0` in the browser
3. Check that no other application is using port 8000

