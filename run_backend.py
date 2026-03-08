import os
import uvicorn

# Change to backend directory
os.chdir(r'c:\Users\nouma\Desktop\AGRIGURD AI\backend')

# Run the backend
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="localhost", port=8000, reload=True)
