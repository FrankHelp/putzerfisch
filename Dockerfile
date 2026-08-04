# ---- Stage 1: Dependencies + Frontend-Build --------------------------------
FROM node:22-slim AS build
WORKDIR /app

# Erst nur die Manifeste kopieren -> Layer-Cache bleibt bei Code-Änderungen erhalten
COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci

COPY server ./server
COPY client ./client
RUN npm run build

# ---- Stage 2: Runtime (nur Server-Deps + gebautes Frontend) ----------------
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY server/package.json server/package.json
COPY client/package.json client/package.json
RUN npm ci --omit=dev --workspace=putzapp-server

COPY --from=build /app/server ./server
COPY --from=build /app/client/dist ./client/dist

ENV PORT=4321
EXPOSE 4321

# DB + Uploads liegen außerhalb des Containers (Bind-Mount ./data), siehe docker-compose.yml
CMD ["node", "server/index.js"]
