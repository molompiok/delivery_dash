FROM node:20-alpine AS base

RUN npm install -g pnpm

# All deps stage
FROM base AS deps
WORKDIR /app
ADD package.json pnpm-lock.yaml ./
RUN pnpm install

# Build stage
FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
ADD . .
RUN pnpm build

# Production stage
FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm
COPY --from=build /app/dist /app/dist
COPY --from=build /app/package.json /app/package.json
RUN pnpm install --prod
EXPOSE 4002
CMD ["node", "./dist/server/index.mjs"]
