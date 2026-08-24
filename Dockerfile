# Multi-stage Dockerfile para SPM Store Sistema Fiscal
FROM node:22-alpine AS builder

WORKDIR /app

# Copia arquivos de dependências
COPY package.json bun.lock* package-lock.json* ./

# Instala todas as dependências (incluindo devDependencies para o build)
RUN npm install

# Copia o código-fonte da aplicação
COPY . .

# Executa o build de produção (Vite + esbuild)
RUN npm run build

# Stage de Produção
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Instala apenas dependências de produção
COPY package.json bun.lock* package-lock.json* ./
RUN npm install --omit=dev

# Copia o bundle compilado do servidor e os assets estáticos do frontend
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/lib/pdfParser.ts ./src/lib/pdfParser.ts

# Cria pastas para uploads e armazenamento persistente de notas fiscais
RUN mkdir -p uploads Notas_Fiscais data

# Expõe a porta do servidor
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Inicia o servidor Node.js
CMD ["node", "dist/server.cjs"]
