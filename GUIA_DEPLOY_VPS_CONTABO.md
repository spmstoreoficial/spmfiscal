# 🚀 Guia Oficial de Deploy: VPS Linux + Bitvise SSH + Portainer + Traefik
### Sistema: SPM Store - Central Fiscal & Gestão de NFs
### Domínio Oficial: `https://spmstore.spmoficial.com.br`

---

## 📑 Sumário
1. [Por que antes vinha um index básico sem dados?](#-por-que-antes-vinha-um-index-básico-sem-dados)
2. [Passo 1: Enviar os Arquivos via Bitvise SSH Client](#-passo-1-enviar-os-arquivos-via-bitvise-ssh-client)
3. [Passo 2: Build da Imagem Docker na VPS (1 Comando)](#-passo-2-build-da-imagem-docker-na-vps)
4. [Passo 3: Criar a Stack no Portainer.io (Com Traefik)](#-passo-3-criar-a-stack-no-portainerio)
5. [Passo 4: DNS no Cloudflare](#-passo-4-dns-no-cloudflare)
6. [Credenciais de Acesso & Contas Padrão](#-credenciais-de-acesso--contas-padrão)
7. [Garantia de Dados: 2.650 Notas Fiscais + Estoque](#-garantia-de-dados)

---

## 🔍 Por que antes vinha um index básico sem dados?

Nas tentativas anteriores no Portainer:
1. **O MySQL iniciava zerado (sem tabelas e sem notas)**: Como o arquivo SQL não estava no caminho do Portainer, o container MySQL criava uma base vazia.
2. **O backend não fazia o auto-seed**: Ao consultar o banco conectado e encontrar 0 registros, o sistema retornava `[]` (array vazio) para o frontend.
3. **Faltava o fallback de segurança**: Se o banco estivesse vazio, o sistema não recorria aos arquivos locais `invoices.json` (com as 2.650 notas) nem criava as contas de login.

### ✅ O que foi corrigido no código:
- **Auto-Seed Imediato**: Se o MySQL estiver vazio, o backend executa automaticamente o `database_spm_fiscal.sql` na inicialização e popula todas as **2.650 notas fiscais**, regras de alertas, estoque e usuários.
- **Camada Dupla de Proteção (Fail-Safe)**: Se o MySQL demorar para responder ou estiver vazio, o backend imediatamente serve os dados do `invoices.json` e `users.json`, garantindo que **a dashboard NUNCA fique vazia**.
- **Contas de Login Garantidas**: Administrador (`josegaldino@hotmail.com.br` / `admin123`), Gerente e Auditor estão fixados no código caso o banco demore a carregar.
- **Frontend SPA 100% Compilado**: A pasta `dist/` já contém o index com Tailwind, mapa do Brasil interativo, gráficos de marketplace, rankings e controle de estoque central.

---

## 📂 Passo 1: Enviar os Arquivos via Bitvise SSH Client

> **Dúvida do usuário:** *"Posso jogar direto na VPS `/root/`?"*
> **Recomendação Oficial:** Crie a pasta **/root/spmfiscal** dentro do root. Jogar arquivos soltos direto em `/root/` mistura os arquivos do projeto com os arquivos de configuração do sistema Linux (`.bashrc`, `.ssh`, logs do servidor). Criando `/root/spmfiscal`, tudo fica isolado, limpo e profissional.

### Como transferir pelo Bitvise SSH Client:

1. Abra o **Bitvise SSH Client** no seu computador.
2. Conecte na sua VPS (Host: `SEU_IP_DA_VPS`, Port: `22`, User: `root`, Password: sua senha).
3. Na barra de ferramentas do Bitvise, clique no botão **New SFTP Window** (abre a janela de transferência de arquivos).
4. No painel direito (servidor remoto):
   * Navegue até a pasta `/root/`.
   * Clique com o botão direito e crie um diretório chamado: **`spmfiscal`**.
   * Entre na pasta `/root/spmfiscal/`.
5. No painel esquerdo (seu computador):
   * Navegue até a pasta do projeto `C:\xampp\htdocs\spmfiscal\`.
6. Selecione **todos os arquivos e pastas** do projeto (inclusive `dist/`, `data/`, `src/`, `database_spm_fiscal.sql`, `Dockerfile`, `docker-compose.portainer.yml`, `package.json`, `server.js`, `server.ts`):
7. Arraste do lado esquerdo (seu PC) para o lado direito (`/root/spmfiscal/`).
8. Aguarde o upload concluir 100%.

---

## 🔨 Passo 2: Build da Imagem Docker na VPS

No Bitvise, clique no botão **New Terminal Console** (janela preta de comando SSH) e execute:

```bash
# 1. Entrar na pasta do projeto
cd /root/spmfiscal

# 2. Garantir que a rede do Traefik existe
docker network inspect OnlineNet >/dev/null 2>&1 || docker network create OnlineNet

# 3. Compilar a imagem Docker com todos os dados embutidos
docker compose build
```

Esse comando irá gerar a imagem **`spm-fiscal:latest`** localmente na sua VPS, com o frontend React compilado, o backend Node.js e as 2.650 notas fiscais prontas.

---

## 🐳 Passo 3: Criar a Stack no Portainer.io (Com Traefik)

1. Acesse o painel do **Portainer CE** no seu navegador (`https://SEU_IP:9443`).
2. No menu lateral, clique em **Stacks** > **Add stack**.
3. **Nome da Stack**: `spm-fiscal`.
4. Em **Build method**, deixe selecionado **Web editor**.
5. Cole o código exato abaixo:

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: spm-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD:-spm_fiscal_root_pass_2026!}
      MYSQL_DATABASE: ${DB_NAME:-spm_fiscal}
      TZ: America/Sao_Paulo
    ports:
      - "3306:3306"
    volumes:
      - spm_mysql_data:/var/lib/mysql
    networks:
      OnlineNet:
        aliases:
          - mysql
          - spm-mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 20s

  spm-fiscal:
    build:
      context: /root/spmfiscal
      dockerfile: Dockerfile
    image: spm-fiscal:latest
    container_name: spm-fiscal
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: "3000"
      DB_HOST: mysql
      DB_PORT: "3306"
      DB_USER: root
      DB_PASSWORD: ${DB_PASSWORD:-spm_fiscal_root_pass_2026!}
      DB_NAME: ${DB_NAME:-spm_fiscal}
      JWT_SECRET: ${JWT_SECRET:-spm_store_ultra_secure_jwt_token_prod_2026_fiscal_elite}
      APP_URL: ${APP_URL:-https://spmstore.spmoficial.com.br}
      TZ: America/Sao_Paulo
    volumes:
      - spm_notas_fiscais:/app/Notas_Fiscais
      - spm_data:/app/data
      - spm_uploads:/app/uploads
    networks:
      OnlineNet:
        aliases:
          - spm-fiscal
          - spmstore
    depends_on:
      mysql:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3000/api/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 25s
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=OnlineNet"
      - "traefik.http.routers.spmfiscal.rule=Host(`spmstore.spmoficial.com.br`)"
      - "traefik.http.routers.spmfiscal.entrypoints=websecure"
      - "traefik.http.routers.spmfiscal.tls=true"
      - "traefik.http.routers.spmfiscal.tls.certresolver=letsencrypt"
      - "traefik.http.services.spmfiscal.loadbalancer.server.port=3000"

volumes:
  spm_mysql_data:
    driver: local
  spm_notas_fiscais:
    driver: local
  spm_data:
    driver: local
  spm_uploads:
    driver: local

networks:
  OnlineNet:
    external: true
    name: OnlineNet
```

> **Dica Traefik:** Se o nome do seu `certresolver` no Traefik for diferente de `letsencrypt` (exemplo: `myresolver`, `cloudflare` ou `le`), basta alterar a linha `traefik.http.routers.spmfiscal.tls.certresolver=SEU_RESOLVER`.

6. Clique no botão azul **Deploy the stack**.

---

## ☁️ Passo 4: DNS no Cloudflare

No painel do Cloudflare (domínio `spmoficial.com.br`):
1. Vá em **DNS > Records**:
   * **Tipo**: `A`
   * **Nome**: `spmstore`
   * **IPv4 address**: O IP da sua VPS Contabo.
   * **Proxy status**: **Proxied (Nuvem Laranja 🟧)**
2. Em **SSL/TLS**:
   * Certifique-se de que está em **Full** (ou **Flexible**).

---

## 🔑 Credenciais de Acesso & Contas Padrão

| Perfil | E-mail | Senha Padrão | Nível de Acesso |
| :--- | :--- | :--- | :--- |
| **Administrador** | `josegaldino@hotmail.com.br` | `admin123` | Acesso Total (Diretoria & Configurações) |
| **Gerente** | `gerente@empresa.com` | `gerente123` | Gestão de Estoque e Faturamento |
| **Auditor** | `auditor@empresa.com` | `auditor123` | Consulta e Auditoria Fiscal |

*(Na tela de login do sistema há 3 botões rápidos para clicar e preencher automaticamente cada usuário).*

---

## 📊 Garantia de Dados: O que vai carregar na Dashboard

Ao acessar **`https://spmstore.spmoficial.com.br`**, a dashboard abrirá com **100% dos dados completos**:
* ✅ **2.650 Notas Fiscais** com valores de faturamento, impostos e descontos.
* ✅ **Mapa do Brasil com Leaflet**: marcadores e calor de vendas nos estados e municípios.
* ✅ **Live Stream**: fluxo contínuo de notas fiscais operacionais.
* ✅ **Rankings**: top compradores, cidades campeãs de vendas e produtos mais vendidos.
* ✅ **Estoque Central (StockHomeView)**: produtos (Verniz Preto, Marrom, Incolor, Kits) com saldo atual, consumo diário e alerta de esgotamento.
* ✅ **DatabaseView**: busca rápida, paginação de 2.650 notas e exportação Excel/PDF.
* ✅ **Ticker Contínuo**: rodapé animado com as últimas vendas em tempo real.
