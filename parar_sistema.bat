@echo off
chcp 65001 >nul
title SPM Store - Parar Servicos
echo ================================================================================
echo              ENCERRANDO SERVICOS DO SISTEMA SPM FISCAL E XAMPP
echo ================================================================================
echo.

set "XAMPP_DIR=C:\xampp"
if not exist "%XAMPP_DIR%\xampp-control.exe" (
    if exist "..\..\xampp-control.exe" (
        set "XAMPP_DIR=..\.."
    )
)

echo [1/2] Parando Apache e MySQL do XAMPP...
if exist "%XAMPP_DIR%\apache_stop.bat" call "%XAMPP_DIR%\apache_stop.bat" >nul 2>&1
if exist "%XAMPP_DIR%\mysql_stop.bat" call "%XAMPP_DIR%\mysql_stop.bat" >nul 2>&1

echo [2/2] Finalizando processos do servidor Node.js e tsx na porta 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [OK] Servicos finalizados com sucesso!
echo.
pause
