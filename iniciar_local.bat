@echo off
title SPM Store Fiscal - Servidor
cd /d "%~dp0"
echo ====================================================
echo      INICIANDO SPM STORE FISCAL & AUDITORIA NFs     
echo ====================================================
echo.
echo Acessando aplicacao em: http://localhost:3000
echo.
start http://localhost:3000
call npm.cmd run dev
if errorlevel 1 (
    echo.
    echo Tentando executar via npx tsx...
    call npx.cmd tsx server.ts
)
pause
