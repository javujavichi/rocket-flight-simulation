FROM node:18-alpine

WORKDIR /app

# Copy shared types
COPY lib/telemetry-types.ts /app-shared/lib/telemetry-types.ts

# Copy service files
COPY realtime-gateway/package.json realtime-gateway/pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install

COPY realtime-gateway/ ./

EXPOSE 8080

CMD ["pnpm", "dev"]
