FROM ruby:3.4.12-bookworm

# postgresql-client for `rails dbconsole`; libpq-dev (for the pg gem) is already part of this image
RUN apt-get update \
  && apt-get install -y --no-install-recommends postgresql-client \
  && rm -rf /var/lib/apt/lists/*
