# SPM Store - Sistema Fiscal & Auditoria NFs

Sistema de Extração, Gestão e Auditoria de Notas Fiscais (DANFE / PDF) com Banco de Dados **MySQL**, Suporte a IA (Gemini), Integrações (Power BI, Google Sheets, Excel) e XAMPP.

---

## 🚀 Como Executar no seu Computador (PC Local com XAMPP)

### 1. Requisitos Prévios
- **Node.js**: Versão 18 ou superior ([nodejs.org](https://nodejs.org)).
- **XAMPP**: Com o módulo **MySQL** iniciado (porta padrão `3306`).

---

### 2. Passo a Passo Rápido

1. **Iniciar o MySQL no XAMPP**:
   - Abra o **XAMPP Control Panel** e clique em **Start** no módulo **MySQL**.

2. **Configurar as Variáveis de Ambiente**:
   - O arquivo `.env` já vem pré-configurado para o XAMPP:
     ```env
     DB_HOST=localhost
     DB_PORT=3306
     DB_USER=root
     DB_PASSWORD=
     DB_NAME=spm_fiscal
     ```
   - O sistema cria o banco `spm_fiscal` e todas as tabelas **automaticamente** na primeira execução.

3. **Instalar Dependências**:
   ```cmd
   npm install
   ```

4. **Executar em Modo de Desenvolvimento**:
   ```cmd
   npm run dev
   ```
   *O sistema estará disponível em:* **`http://localhost:3000`**

5. **Executar em Modo de Produção**:
   ```cmd
   npm run build
   npm start
   ```

---

## 🐘 Como Executar Integrado ao XAMPP (Apache + MySQL)

1. **Localização**:
   A pasta do projeto fica em:
   `C:\xampp\htdocs\spmfiscal`

2. **Acessar o Banco no phpMyAdmin**:
   - Acesse `http://localhost/phpmyadmin`
   - O banco `spm_fiscal` conterá as tabelas: `invoices`, `users`, `user_passwords`, `audit_logs`, `alert_rules`, `system_settings` e `integrations_config`.

3. **Manter o Servidor Ativo com PM2**:
   ```cmd
   npm install -g pm2
   pm2 start server.ts --name "spm-fiscal-api"
   ```

---

## 🐳 Como Executar com Docker & Docker Compose

1. **Construir e iniciar os containers (App + MySQL + Cloudflare Tunnel)**:
   ```cmd
   docker compose up -d --build
   ```

2. **Acessar**:
   - `http://localhost:3000`

3. **Parar os containers**:
   ```cmd
   docker compose down
   ```

---

## 💾 Tabelas e Persistência no MySQL

O sistema migra automaticamente os dados existentes para as tabelas:
- **`invoices`**: Registros e itens de Notas Fiscais (Shopee, ML, TikTok, WhatsApp, etc.).
- **`users`** & **`user_passwords`**: Usuários e hashes criptografados com `bcrypt`.
- **`audit_logs`**: Trilha de auditoria e conformidade fiscal.
- **`alert_rules`**: Regras de alerta de alto valor, erros e notificações.
- **`system_settings`**: Configurações de SMTP, IA Gemini e integrações.
- **`integrations_config`**: Parâmetros de sincronização com Power BI e Google Sheets.

---

## 🔐 Contas de Acesso Pré-cadastradas
- **ADMIN**: `josegaldino@hotmail.com.br` | Senha: `admin123`
- **GERENTE**: `gerente@empresa.com` | Senha: `gerente123`
- **AUDITOR**: `auditor@empresa.com` | Senha: `auditor123`
