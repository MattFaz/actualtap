# Stage 1: Install dependencies
FROM node:lts-alpine AS builder

# Build tools for native modules (better-sqlite3 compiles from source)
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev

# Stage 2: Runtime (without npm to remove CVEs in npm's dependencies)
FROM node:lts-alpine

WORKDIR /app

# Copy only what we need from builder
COPY --from=builder /app/node_modules ./node_modules
COPY ./src ./src
COPY package.json ./

# Remove npm and its vulnerable dependencies (glob, tar)
# These are only needed at build time, not runtime
RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/bin/npm \
           /usr/local/bin/npx

EXPOSE 3001

CMD ["node", "src/server.js"]
