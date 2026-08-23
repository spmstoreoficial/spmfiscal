# SPM Store - Sistema Fiscal & Auditoria NFs

Sistema de Extração, Gestão e Auditoria de Notas Fiscais (DANFE / PDF) com Suporte a IA, Excel e XAMPP.

---

## 🚀 Como Executar no seu Computador (PC Local)

### 1. Requisitos Prévios
- **Node.js**: Baixe e instale a versão LTS recomendada no site oficial: [nodejs.org](https://nodejs.org) (Versão 18 ou superior).

---

### 2. Passo a Passo Simples (Recomendado)

1. **Extrair os Arquivos**:
   Extraia o arquivo `.zip` em uma pasta no seu computador (Exemplo: `C:\spm-fiscal`).

2. **Abrir o Terminal ou Prompt de Comando**:
   Navegue até a pasta extraída:
   ```cmd
   cd C:\spm-fiscal
   ```

3. **Instalar as Dependências**:
   No terminal, execute:
   ```cmd
   npm install
   ```

4. **Executar em Modo de Desenvolvimento (Testes)**:
   ```cmd
   npm run dev
   ```
   *O sistema estará disponível em:* **`http://localhost:3000`**

5. **Executar em Modo de Produção (Compilado)**:
   ```cmd
   npm run build
   npm start
   ```

---

## 🐘 Como Executar Integrado ao XAMPP (Apache)

1. **Copiar a pasta para o XAMPP**:
   Copie os arquivos da aplicação para a pasta:
   `C:\xampp\htdocs\spm-fiscal`

2. **Instalar e Compilar**:
   Abra o Terminal/PowerShell em `C:\xampp\htdocs\spm-fiscal`:
   ```cmd
   npm install
   npm run build
   ```

3. **Ativar o Servidor em Segundo Plano**:
   Para manter a API Node rodando continuamente:
   ```cmd
   npm install -g pm2
   pm2 start server.ts --name "spm-fiscal-api"
   ```

4. **Acessar**:
   - Pelo Apache XAMPP: `http://localhost/spm-fiscal`
   - Diretamente pelo Node: `http://localhost:3000`

---

## 🔐 Contas de Acesso Pré-cadastradas
- **ADMIN**: `josegaldino@hotmail.com.br` | Senha: `admin123`
- **GERENTE**: `gerente@empresa.com` | Senha: `admin123`
- **AUDITOR**: `auditor@empresa.com` | Senha: `admin123`
