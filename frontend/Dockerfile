# ============================================================
# Dockerfile - FaceMax Frontend (React/Vite)
# ============================================================
# Multi-stage build: Node.js para build + Nginx para servir
#
# O arquivo .env na pasta frontend/ e copiado automaticamente
# durante o build. As variaveis VITE_* sao embutidas no bundle.
#
# Build:
#   docker build -t facemax-frontend .
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

# Copiar codigo-fonte (incluindo .env)
COPY . .

# Build da aplicacao (as variaveis VITE_* sao embutidas no bundle)
RUN npm run build

# --- Estagio 2: Servir com Nginx ---
FROM nginx:alpine

# Copiar configuracao do Nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos estaticos do build
COPY --from=build /app/dist /usr/share/nginx/html

# Expor porta
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
