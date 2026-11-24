Set-Location -Path $PSScriptRoot
if (Test-Path ".\venv\Scripts\python.exe") {
    Write-Host "Starting VoiceApp backend using virtual environment..." -ForegroundColor Green
    & ".\venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
} else {
    Write-Host "Starting VoiceApp backend..." -ForegroundColor Yellow
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
}
