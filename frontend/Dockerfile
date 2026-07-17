# ============================================================
# Dockerfile - FaceMax Frontend (React/Vite)
# ============================================================
# Multi-stage build: Node.js para build + Nginx para servir
#
# As variaveis VITE_* sao injetadas via --build-arg durante o
# build do Docker. NENHUM arquivo .env e necessario dentro do
# container — o bundle e imutavel e auto-contido.
#
# Build:
#   docker build \
#     --build-arg VITE_SUPABASE_URL=https://xxx.supabase.co \
#     --build-arg VITE_SUPABASE_ANON_KEY=eyJ... \
#     --build-arg VITE_API_URL=https://api.facemax.app/api/v1 \
#     -t facemax-frontend .
#
# Run:
#   docker run -d -p 3000:80 facemax-frontend
# ============================================================

# --- Estagio 1: Build ---
FROM node:20-alpine AS build

WORKDIR /app

# Copiar package.json primeiro (cache de camadas)
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar codigo-fonte (sem .env — variaveis via ARG/ENV)
COPY . .

# Variaveis de ambiente VITE injetadas via --build-arg
# O Vite embute estas valores diretamente no bundle JS durante build
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_URL=http://localhost:8000/api/v1

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_API_URL=$VITE_API_URL

# Build da aplicacao (as variaveis VITE_* sao embutidas no bundle)
RUN npm run build

# --- Estagio 2: Servir com Nginx ---
FROM nginx:alpine

# Copiar configuracao do Nginx (producao: proxy reverso + seguranca)
COPY nginx.production.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos estaticos do build
COPY --from=build /app/dist /usr/share/nginx/html

# Remover config padrao do Nginx
RUN rm -f /etc/nginx/conf.d/default.conf.bak

# Expor porta
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
