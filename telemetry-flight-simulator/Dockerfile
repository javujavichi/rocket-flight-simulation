FROM node:18-alpine

WORKDIR /app

# Copy shared types
COPY lib/telemetry-types.ts /app-shared/lib/telemetry-types.ts
COPY lib/simulation-engine.ts /app-shared/lib/simulation-engine.ts

# Copy service files
COPY telemetry-flight-simulator/package.json telemetry-flight-simulator/pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install

COPY telemetry-flight-simulator/ ./

CMD ["pnpm", "dev"]
