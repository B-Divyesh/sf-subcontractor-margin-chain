FROM node:22-bookworm-slim AS web-builder
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts ./
COPY src ./src
RUN npm run build

FROM rust:1.98-bookworm AS api-builder
ARG BUILD_SHA=dev
WORKDIR /src
COPY server/Cargo.toml server/Cargo.lock ./server/
COPY server/src ./server/src
RUN BUILD_SHA="$BUILD_SHA" cargo build --manifest-path server/Cargo.toml --release --locked

FROM debian:bookworm-slim AS runtime
ARG BUILD_SHA=dev
RUN apt-get update \
    && apt-get install --no-install-recommends -y ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system app \
    && useradd --system --gid app --home-dir /app app
WORKDIR /app
COPY --from=api-builder /src/server/target/release/subcontractor-margin-chain-server /app/server
COPY --from=web-builder /src/dist /app/dist
RUN chown -R app:app /app
USER app
ENV PORT=8080
ENV STATIC_DIR=/app/dist
EXPOSE 8080
ENTRYPOINT ["/app/server"]

