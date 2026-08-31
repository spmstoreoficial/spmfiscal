@echo off
chcp 65001 >nul
title SPM Store - Sistema Fiscal ^& Auditoria NFs
cls

echo ================================================================
echo        SPM STORE - SISTEMA FISCAL ^& AUDITORIA DE NFs
echo ================================================================
echo.

:: 1. Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao foi encontrado no seu computador!
    echo Por favor, baixe e instale o Node.js em: https://nodejs.org
    echo Apos instalar, reinicie este arquivo.
    echo.
    pause
    exit /b 1
)

:: 2. Verificar arquivo .env
if not exist ".env" (
    if exist ".env.example" (
        echo [AVISO] Arquivo .env nao encontrado. Copiando de .env.example...
        copy ".env.example" ".env" >nul
        echo [OK] Arquivo .env criado com sucesso!
    ) else (
        echo [AVISO] Criando arquivo .env padrao para XAMPP...
        (
            echo DB_HOST=localhost
            echo DB_PORT=3306
            echo DB_USER=root
            echo DB_PASSWORD=
            echo DB_NAME=spm_fiscal
            echo JWT_SECRET=spm_store_chave_secreta_jwt_producao_2026
            echo PORT=3000
            echo GEMINI_API_KEY=
            echo APP_URL=http://localhost:3000
        ) > .env
        echo [OK] Arquivo .env gerado!
    )
)

:: 3. Verificar dependencias (node_modules)
if not exist "node_modules\" (
    echo [INFO] Primeira execucao detectada. Instalando dependencias (npm install)...
    echo Isso pode levar alguns instantes...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao instalar dependencias do Node.js.
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas com sucesso!
    echo.
)

:: 4. Verificar se XAMPP MySQL esta rodando na porta 3306
netstat -ano | findstr :3306 >nul 2>nul
if %errorlevel% neq 0 (
    echo ----------------------------------------------------------------
    echo [AVISO XAMPP]
    echo O servico MySQL nao foi detectado na porta 3306.
    echo Lembre-se de abrir o XAMPP Control Panel e clicar em [Start] no MySQL!
    echo ----------------------------------------------------------------
    echo.
)

:MENU
echo Escolha uma opcao:
echo   [1] Iniciar Sistema em Modo Desenvolvimento (Recomendado)
echo   [2] Iniciar Sistema em Modo Producao (Build + Start)
echo   [3] Importar / Restaurar Banco de Dados MySQL (database_spm_fiscal.sql)
echo   [4] Reinstalar Dependencias (npm install)
echo   [5] Sair
echo.
set /p opt="Digite o numero da opcao desejada [Padrao: 1]: "

if "%opt%"=="" set opt=1
if "%opt%"=="1" goto DEV
if "%opt%"=="2" goto PROD
if "%opt%"=="3" goto IMPORT_DB
if "%opt%"=="4" goto INSTALL_DEPS
if "%opt%"=="5" goto SAIR
goto MENU

:DEV
echo.
echo ================================================================
echo [INICIANDO] Servidor local: http://localhost:3000
echo [NAVEGADOR] Abrindo automaticamente em 3 segundos...
echo [INFO] Para encerrar a execucao, pressione Ctrl + C no terminal.
echo ================================================================
echo.
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"
call npm run dev
goto FIM

:PROD
echo.
echo [PRODUCAO] Compilando aplicacao (Build)...
call npm run build
if %errorlevel% neq 0 (
    echo [ERRO] Falha no build.
    pause
    exit /b 1
)
echo.
echo ================================================================
echo [INICIANDO] Servidor de Producao: http://localhost:3000
echo [NAVEGADOR] Abrindo automaticamente em 3 segundos...
echo ================================================================
echo.
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"
call npm start
goto FIM

:IMPORT_DB
echo.
echo [BANCO] Importando script SQL para o MySQL do XAMPP...
call npm run db:import
echo.
pause
cls
goto MENU

:INSTALL_DEPS
echo.
echo [NPM] Reinstalando dependencias do projeto...
call npm install
echo.
pause
cls
goto MENU

:SAIR
echo Encerrando...
exit /b 0

:FIM
pause
