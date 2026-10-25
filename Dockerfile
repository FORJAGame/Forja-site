# One image for every environment: the build needs no database or secrets; see docker/app/entrypoint.sh for what runs at start.
FROM node:24-slim AS base
RUN npm install --global pnpm@12.6.0
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 NODE_OPTIONS=--no-deprecation

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm exec next build --experimental-build-mode compile \
 && pnpm prune --prod

FROM base AS runtime
ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app ./
USER node
EXPOSE 3000
ENTRYPOINT ["docker/app/entrypoint.sh"]
