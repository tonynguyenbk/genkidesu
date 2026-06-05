@echo off
echo ========================================
echo   Genki Dev Server
echo ========================================
echo.

:: Kill any process using port 4000 or 8081
echo Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":4000 " ^| findstr "LISTENING"') do (
  if not "%%a"=="0" taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":8081 " ^| findstr "LISTENING"') do (
  if not "%%a"=="0" taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul

:: Start API server
echo Starting API server on port 4000...
start "Genki API :4000" cmd /k "cd /d D:\GENKIdesu\packages\api && set DATABASE_URL=postgresql://genki:genki_dev_2026@localhost:5433/genki && set REDIS_URL=redis://localhost:6379 && set JWT_SECRET=genki-dev-secret-change-in-production-2026 && set NODE_ENV=development && set PORT=4000 && node_modules\.bin\tsx.CMD src/server.ts"

:: Wait a moment then start Expo
timeout /t 3 /nobreak >nul

:: Start Expo
echo Starting Expo web on port 8081...
start "Genki Expo :8081" cmd /k "cd /d D:\GENKIdesu\apps\mobile && %APPDATA%\npm\pnpm.CMD exec expo start --web"

echo.
echo ========================================
echo   Servers starting in separate windows
echo   API:  http://localhost:4000/health
echo   Web:  http://localhost:8081
echo ========================================
echo.
echo Nhan phim bat ky de dong cua so nay...
pause >nul
