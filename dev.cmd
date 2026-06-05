@echo off
echo Starting Genki dev servers...

REM Start API server
start "Genki API :4000" cmd /k "cd /d D:\GENKIdesu\packages\api && set DATABASE_URL=postgresql://genki:genki_dev_2026@localhost:5433/genki && set JWT_SECRET=genki-dev-secret-change-in-production-2026 && set NODE_ENV=development && set PORT=4000 && node_modules\.bin\tsx.CMD src/server.ts"

REM Start Expo web server
start "Genki Expo :8081" cmd /k "cd /d D:\GENKIdesu\apps\mobile && %APPDATA%\npm\pnpm.CMD exec expo start --web"

echo.
echo Servers starting...
echo API:  http://localhost:4000
echo Web:  http://localhost:8081
echo.
echo Dung cua so nay de tai ca 2 server.
