@echo off
cd /d "%~dp0"
if exist "venv\Scripts\python.exe" (
    echo Starting VoiceApp backend using virtual environment...
    venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
) else if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
    echo Starting VoiceApp backend using Python 3.11...
    "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
) else (
    echo Using system python...
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
)
pause
