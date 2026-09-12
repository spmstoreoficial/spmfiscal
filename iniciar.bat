@echo off
title SPM Store Fiscal - Inicializador
cd /d "%~dp0"

if exist "%~dp0iniciar.ps1" (
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0iniciar.ps1"
    if errorlevel 1 (
        echo.
        echo Falha ao executar via PowerShell. Tentando modo de contingencia CMD...
        call "%~dp0iniciar_local.bat"
    )
) else (
    call "%~dp0iniciar_local.bat"
)
