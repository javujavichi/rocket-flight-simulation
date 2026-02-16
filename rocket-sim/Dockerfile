FROM node:18-alpine

WORKDIR /app

# Copy shared types
COPY lib/telemetry-types.ts /app-shared/lib/telemetry-types.ts
COPY lib/simulation-engine.ts /app-shared/lib/simulation-engine.ts

# Copy service files
COPY rocket-sim/package.json rocket-sim/pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install

COPY rocket-sim/ ./

CMD ["pnpm", "dev"]
