# Multi-stage Dockerfile para SPM Store Sistema Fiscal (Linux Debian-slim)
FROM node:22-slim AS builder

WORKDIR /app

# Instala ferramentas nativas de compilação do Debian
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copia dependências e instala tudo para o build
COPY package*.json ./
RUN npm install

# Copia o código-fonte e compila (Vite + esbuild para dist/server.cjs)
COPY . .
RUN npm run build

# Estágio de execução (Runner de Produção)
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copia as dependências, servidor, assets compilados e arquivos de dados
COPY package*.json ./
COPY server.js ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data
COPY --from=builder /app/database_spm_fiscal.sql ./database_spm_fiscal.sql
COPY --from=builder /app/public ./public

# Garante a existência dos diretórios de dados e uploads
RUN mkdir -p /app/uploads /app/Notas_Fiscais /app/data

EXPOSE 3000

CMD ["npm", "start"]