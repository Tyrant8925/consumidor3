@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
 echo Instala Node.js desde https://nodejs.org/ y vuelve a abrir este archivo.
 pause
 exit /b 1
)
echo Abre http://127.0.0.1:3000 en tu navegador cuando el servidor este listo.
node server.js
pause
