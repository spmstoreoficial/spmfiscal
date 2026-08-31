@echo off
chcp 65001 >nul
title SPM Store - Central Fiscal & Auditoria NFs - Execucao Local com XAMPP

cls
echo ================================================================================
echo           SPM STORE - CENTRAL DE COMANDO FISCAL & AUDITORIA NFs
echo           Painel de Extração DANFE, Gestão MySQL e Monitoramento Ao Vivo
echo ================================================================================
echo.

:: 1. Definir caminhos do XAMPP
set "XAMPP_DIR=C:\xampp"
if not exist "%XAMPP_DIR%\xampp-control.exe" (
    if exist "..\..\xampp-control.exe" (
        set "XAMPP_DIR=..\.."
    )
)

echo [1/4] Verificando servicos do XAMPP em: %XAMPP_DIR%

:: 2. Iniciar Apache se nao estiver rodando
tasklist /FI "IMAGENAME eq httpd.exe" 2>NUL | find /I "httpd.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo   [OK] Apache ja esta em execucao.
) else (
    echo   [..] Iniciando Apache do XAMPP...
    if exist "%XAMPP_DIR%\apache_start.bat" (
        start "" /min "%XAMPP_DIR%\apache_start.bat"
        timeout /t 2 /nobreak >nul
        echo   [OK] Apache iniciado com sucesso.
    ) else (
        echo   [AVISO] apache_start.bat nao encontrado em %XAMPP_DIR%.
    )
)

:: 3. Iniciar MySQL se nao estiver rodando
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I "mysqld.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo   [OK] MySQL ja esta em execucao (Porta 3306).
) else (
    echo   [..] Iniciando MySQL do XAMPP...
    if exist "%XAMPP_DIR%\mysql_start.bat" (
        start "" /min "%XAMPP_DIR%\mysql_start.bat"
        timeout /t 2 /nobreak >nul
        echo   [OK] MySQL iniciado com sucesso.
    ) else (
        echo   [AVISO] mysql_start.bat nao encontrado em %XAMPP_DIR%.
    )
)

echo.
echo [2/4] Verificando ambiente Node.js e Dependencias...

:: 4. Verificar Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Node.js nao foi encontrado no seu computador!
    echo Por favor, baixe e instale o Node.js em: https://nodejs.org
    pause
    exit /b 1
)

for /f "delims=" %%i in ('node -v') do set "NODE_VER=%%i"
for /f "delims=" %%i in ('npm -v') do set "NPM_VER=%%i"
echo   [OK] Node.js detectado: %NODE_VER% / NPM: %NPM_VER%

:: 5. Verificar arquivo .env
if not exist ".env" (
    if exist ".env.example" (
        echo   [..] Copiando configuracoes padrao de .env.example para .env...
        copy ".env.example" ".env" >nul
        echo   [OK] Arquivo .env gerado com sucesso.
    )
)

:: 6. Instalar dependencias se node_modules nao existir
if not exist "node_modules\" (
    echo   [..] Pasta node_modules nao encontrada. Instalando dependencias - npm install...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERRO] Falha ao executar npm install.
        pause
        exit /b 1
    )
    echo   [OK] Dependencias instaladas com sucesso!
) else (
    echo   [OK] Dependencias ja instaladas.
)

echo.
echo [3/4] Escolha a opcao de execucao desejada:
echo ================================================================================
echo   [1] Iniciar Servidor de Desenvolvimento (Vite/Node - Porta 3000) [PADRAO]
echo   [2] Iniciar em Modo Producao (npm run build && npm start)
echo   [3] Importar / Restaurar Banco SQL (database_spm_fiscal.sql)
echo   [4] Abrir Painel de Controle do XAMPP (xampp-control.exe)
echo   [5] Parar Servicos do Sistema e XAMPP (Apache e MySQL)
echo   [0] Sair
echo ================================================================================
echo.

choice /C 123450 /N /T 5 /D 1 /M "Digite sua escolha (inicia padrao em 5s): "
set "ESCOLHA=%ERRORLEVEL%"

if "%ESCOLHA%"=="6" goto SAIR
if "%ESCOLHA%"=="5" goto PARAR_SISTEMA
if "%ESCOLHA%"=="4" goto ABRIR_XAMPP_PANEL
if "%ESCOLHA%"=="3" goto IMPORTAR_SQL
if "%ESCOLHA%"=="2" goto INICIAR_PROD
if "%ESCOLHA%"=="1" goto INICIAR_DEV

:INICIAR_DEV
echo.
echo [4/4] Iniciando Servidor SPM Fiscal...
echo.
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"
call npm run dev
goto FIM

:INICIAR_PROD
echo.
echo [4/4] Gerando Build e Iniciando Servidor de Producao...
echo.
call npm run build
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao compilar o projeto.
    pause
    exit /b 1
)
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"
call npm start
goto FIM

:IMPORTAR_SQL
echo.
echo [BANCO] Importando script SQL para o MySQL do XAMPP...
call npm run db:import
echo.
pause
goto FIM

:ABRIR_XAMPP_PANEL
if exist "%XAMPP_DIR%\xampp-control.exe" (
    start "" "%XAMPP_DIR%\xampp-control.exe"
) else (
    echo [AVISO] xampp-control.exe nao encontrado em %XAMPP_DIR%.
    pause
)
goto FIM

:PARAR_SISTEMA
call "%~dp0parar_sistema.bat"
goto FIM

:SAIR
echo Encerrando...
exit /b 0

:FIM
pause
