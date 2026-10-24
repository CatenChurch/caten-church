# syntax=docker/dockerfile:1
# check=error=true

# Production image for the Caten Church website.
#   docker build -t caten-church .
#   docker run -p 8080:8080 -e RAILS_MASTER_KEY=... -e DATABASE_URL=... -e REDIS_URL=... caten-church
# The same image runs the web server (default CMD) and the Sidekiq worker:
#   docker run ... caten-church bundle exec sidekiq -C config/sidekiq.yml

ARG RUBY_VERSION=3.4.12
ARG NODE_VERSION=24

# Node.js runtime, copied into the build stage for esbuild + Dart Sass.
FROM docker.io/library/node:${NODE_VERSION}-slim AS node

# ---------------------------------------------------------------------------
# Base image shared by the build and final stages
FROM docker.io/library/ruby:${RUBY_VERSION}-slim AS base

WORKDIR /rails

# Install base packages: libpq for pg, jemalloc to reduce memory fragmentation
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl libjemalloc2 libpq5 libyaml-0-2 && \
    ln -s /usr/lib/$(uname -m)-linux-gnu/libjemalloc.so.2 /usr/local/lib/libjemalloc.so && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development:test" \
    LD_PRELOAD="/usr/local/lib/libjemalloc.so"

# ---------------------------------------------------------------------------
# Build gems and precompile assets
FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libpq-dev libyaml-dev pkg-config && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Node.js + npm (only needed to build assets, not shipped in the final image)
COPY --from=node /usr/local/bin/node /usr/local/node/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/node/lib/node_modules
RUN ln -s ../lib/node_modules/npm/bin/npm-cli.js /usr/local/node/bin/npm && \
    ln -s ../lib/node_modules/npm/bin/npx-cli.js /usr/local/node/bin/npx
ENV PATH="/usr/local/node/bin:${PATH}"

# Install application gems
COPY Gemfile Gemfile.lock .ruby-version ./
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile -j 1 --gemfile

# Install node modules
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy application code
COPY . .

# Precompile bootsnap code for faster boot times
RUN bundle exec bootsnap precompile -j 1 app/ lib/

# Build JS/CSS (jsbundling/cssbundling hook into assets:precompile) and fingerprint them with Propshaft.
# No credentials are needed thanks to the dummy secret key base.
RUN SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile

RUN rm -rf node_modules

# ---------------------------------------------------------------------------
# Final image
FROM base

# Run as a non-root user
RUN groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash

COPY --chown=rails:rails --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --chown=rails:rails --from=build /rails /rails

USER 1000:1000

# Thruster serves assets and proxies to Puma (PORT=3000)
ENV HTTP_PORT="8080" \
    TARGET_PORT="3000" \
    PORT="3000"

ENTRYPOINT ["/rails/bin/docker-entrypoint"]

EXPOSE 8080
CMD ["bundle", "exec", "thrust", "./bin/rails", "server"]
