# SPM Store - Inicializador PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "       SPM STORE - SISTEMA FISCAL & AUDITORIA DE NFs" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERRO] Node.js não foi encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale o Node.js em: https://nodejs.org" -ForegroundColor Yellow
    pause
    exit 1
}

# 2. Verificar .env
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Host "[AVISO] Criando .env a partir de .env.example..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
    } else {
        Write-Host "[AVISO] Gerando .env padrão..." -ForegroundColor Yellow
        @"
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=spm_fiscal
JWT_SECRET=spm_store_chave_secreta_jwt_producao_2026
PORT=3000
GEMINI_API_KEY=
APP_URL=http://localhost:3000
"@ | Out-File -FilePath ".env" -Encoding utf8
    }
}

# 3. Verificar dependências
if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Instalando dependências (npm install)..." -ForegroundColor Cyan
    npm install
}

# 4. Verificar porta MySQL
$tcpConn = Test-NetConnection -ComputerName "localhost" -Port 3306 -WarningAction SilentlyContinue -InformationLevel Quiet
if (-not $tcpConn) {
    Write-Host "----------------------------------------------------------------" -ForegroundColor DarkYellow
    Write-Host "[LEMBRETE XAMPP] MySQL não detectado na porta 3306." -ForegroundColor Yellow
    Write-Host "Certifique-se de clicar em [Start] no MySQL do XAMPP Control Panel." -ForegroundColor Yellow
    Write-Host "----------------------------------------------------------------`n" -ForegroundColor DarkYellow
}

Write-Host "Escolha o modo de execução:" -ForegroundColor White
Write-Host " [1] Modo Desenvolvimento (npm run dev) - Recomendado" -ForegroundColor Green
Write-Host " [2] Modo Produção (npm run build && npm start)" -ForegroundColor Cyan
Write-Host " [3] Importar Banco SQL (npm run db:import)" -ForegroundColor Magenta
Write-Host " [4] Sair" -ForegroundColor Gray
Write-Host ""
$choice = Read-Host "Digite a opção desejada [Padrão: 1]"

if ([string]::IsNullOrWhiteSpace($choice)) { $choice = "1" }

switch ($choice) {
    "1" {
        Write-Host "`n[INICIANDO] Abrindo http://localhost:3000..." -ForegroundColor Green
        Start-Process "http://localhost:3000"
        npm run dev
    }
    "2" {
        Write-Host "`n[PRODUÇÃO] Compilando..." -ForegroundColor Cyan
        npm run build
        Start-Process "http://localhost:3000"
        npm start
    }
    "3" {
        Write-Host "`n[BANCO] Importando script SQL..." -ForegroundColor Magenta
        npm run db:import
    }
    Default {
        Write-Host "Encerrando..." -ForegroundColor Gray
    }
}
