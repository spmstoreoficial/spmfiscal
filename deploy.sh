#!/bin/bash

# ==============================================================================
# SCRIPT DE DEPLOY AUTOMATIZADO - SPM STORE SISTEMA FISCAL
# VPS Contabo / Ubuntu 20.04 - 24.04 / Docker / Portainer / Cloudflare
# Domínio: spmoficial.com.br
# ==============================================================================

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}==============================================================================${NC}"
echo -e "${CYAN}   🚀 INICIANDO DEPLOY AUTOMATIZADO - SPM STORE SISTEMA FISCAL               ${NC}"
echo -e "${CYAN}   VPS Contabo | Docker | Portainer | Cloudflare | spmoficial.com.br        ${NC}"
echo -e "${CYAN}==============================================================================${NC}"
echo ""

# 1. Verificar privilégios de root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}[ERRO] Este script precisa ser executado como root (sudo bash deploy.sh).${NC}"
  exit 1
fi

# 2. Atualização dos pacotes do sistema
echo -e "${YELLOW}[1/6] Atualizando pacotes do sistema (apt update & upgrade)...${NC}"
apt-get update -y && apt-get upgrade -y
apt-get install -y curl wget git ufw htop ca-certificates gnupg lsb-release

# 3. Instalação do Docker e Docker Compose (caso não existam)
echo -e "${YELLOW}[2/6] Verificando instalação do Docker e Docker Compose...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${CYAN}Instalando Docker oficial...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}Docker instalado com sucesso!${NC}"
else
    echo -e "${GREEN}Docker já está instalado: $(docker --version)${NC}"
fi

# 4. Instalação e Inicialização do Portainer CE
echo -e "${YELLOW}[3/6] Configurando e inicializando Portainer CE...${NC}"
if [ ! "$(docker ps -a -q -f name=portainer)" ]; then
    echo -e "${CYAN}Criando volume e subindo container do Portainer CE...${NC}"
    docker volume create portainer_data
    docker run -d -p 8000:8000 -p 9443:9443 -p 9000:9000 \
      --name=portainer \
      --restart=always \
      -v /var/run/docker.sock:/var/run/docker.sock \
      -v portainer_data:/data \
      portainer/portainer-ce:latest
    echo -e "${GREEN}Portainer CE iniciado com sucesso nas portas 9443 (HTTPS) e 9000 (HTTP)!${NC}"
else
    echo -e "${GREEN}Portainer já está em execução.${NC}"
fi

# 5. Configuração do Firewall UFW (Segurança Contabo)
echo -e "${YELLOW}[4/6] Configurando Firewall UFW...${NC}"
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 3000/tcp    # SPM Fiscal
ufw allow 9000/tcp    # Portainer HTTP
ufw allow 9443/tcp    # Portainer HTTPS
ufw --force enable

# 6. Configuração das Variáveis de Ambiente (.env)
echo -e "${YELLOW}[5/6] Verificando arquivo de ambiente (.env)...${NC}"
if [ ! -f .env ]; then
    echo -e "${CYAN}Criando arquivo .env de produção...${NC}"
    cat << 'EOF' > .env
NODE_ENV=production
PORT=3000

# Configurações MySQL
DB_HOST=mysql
DB_PORT=3306
DB_USER=root
DB_PASSWORD=spm_fiscal_root_pass_2026!
DB_NAME=spm_fiscal

# Segurança e JWT
JWT_SECRET=spm_store_ultra_secure_jwt_token_prod_2026_fiscal_elite
SESSION_SECRET=spm_store_session_prod_fiscal_2026

# Cloudflare Tunnel Token (Opcional - caso utilize Cloudflare Tunnel)
# CLOUDFLARE_TUNNEL_TOKEN=seu_token_aqui
EOF
    echo -e "${GREEN}Arquivo .env gerado com sucesso.${NC}"
fi

# 7. Build e Execução dos Containers (Docker Compose)
echo -e "${YELLOW}[6/6] Construindo imagens e iniciando aplicação SPM Fiscal...${NC}"
docker compose down || true
docker compose build --no-cache
docker compose up -d

echo ""
echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}   🎉 DEPLOY CONCLUÍDO COM SUCESSO!                                          ${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""
echo -e "${CYAN}📌 URLs de Acesso:${NC}"
echo -e "   • ${YELLOW}Aplicação SPM Fiscal:${NC}  http://$(curl -s ifconfig.me):3000"
echo -e "   • ${YELLOW}Painel Portainer GUI:${NC}  https://$(curl -s ifconfig.me):9443 (ou http://$(curl -s ifconfig.me):9000)"
echo ""
echo -e "${CYAN}📌 Próximos Passos no Cloudflare:${NC}"
echo -e "   1. Acesse o painel da Cloudflare em https://dash.cloudflare.com"
echo -e "   2. Selecione o domínio ${YELLOW}spmoficial.com.br${NC}"
echo -e "   3. Em ${YELLOW}DNS > Records${NC}, crie um apontamento Tipo ${YELLOW}A${NC}:"
echo -e "      • Name: ${YELLOW}@${NC} (ou ${YELLOW}fiscal${NC})"
echo -e "      • IPv4 address: ${YELLOW}$(curl -s ifconfig.me)${NC}"
echo -e "      • Proxy status: ${YELLOW}Proxied (Nuvem Laranja)${NC}"
echo -e "   4. Em ${YELLOW}SSL/TLS${NC}, selecione o modo ${YELLOW}Full${NC} ou ${YELLOW}Flexible${NC}."
echo ""
echo -e "${GREEN}Sistema pronto e operacional na sua VPS Contabo! 🚀${NC}"
