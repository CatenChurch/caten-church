# Caten Church

本專案為茄典教會網站，網址是 <https://caten-church.org/>

## Stack

| | |
|---|---|
| Ruby | 3.4 (`.ruby-version`) |
| Rails | 8.1 |
| Front end | Bootstrap 5.3, Hotwire Turbo, Font Awesome 6, flatpickr |
| Assets | jsbundling-rails (esbuild) + cssbundling-rails (Dart Sass) + Propshaft |
| Database / queue | PostgreSQL, Redis + Sidekiq |
| Node.js | 24 (`.nvmrc`, only needed to build assets) |

## Setup

```sh
git clone https://github.com/CatenChurch/caten-church.git
cd caten-church
bin/setup --skip-server   # bundle install, npm install, build assets, db:prepare
```

Database connection defaults to `postgres:postgres@localhost:5432` and can be changed with
`DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` (see `config/database.yml`).

Copy example credentials from `config/credentials.yml.example`, then fill in your credentials

```sh
EDITOR="code --wait" bin/rails credentials:edit
```

Uploads go to Google Cloud Storage by default. To keep them on disk in development without GCS credentials:

```sh
ACTIVE_STORAGE_SERVICE=local bin/dev
```

Optional: using [mkcert](https://github.com/FiloSottile/mkcert) self-signed certificate to serve <https://localhost:3000>

```sh
mkcert localhost
mv ./localhost.pem ./localhost-key.pem ./config/ssl/
```

Puma only binds SSL when both files exist in `config/ssl/`.

## Usage

```sh
# web server + esbuild/sass watchers + sidekiq (Procfile.dev)
bin/dev

# migrate database
bin/rails db:migrate

# tests (build assets first: npm run build && npm run build:css)
bundle exec rspec
```

rake tasks

```sh
# 寄送下月壽星列表給管理員
bin/rails mail:admin:birth_notification

# 於活動開始前一天提醒報名活動者
bin/rails mail:event:opening_notice_before_1

# generate public/sitemap.xml
bin/rake sitemap:refresh
```

## Docker

The `Dockerfile` builds a production image (Thruster in front of Puma on port 8080, non-root user).
The same image runs the Sidekiq worker with `bundle exec sidekiq -C config/sidekiq.yml`.

```sh
# whole stack: postgres + redis + web + worker, uploads on local disk
docker compose up --build
open http://localhost:8080
```

Optional secrets for compose (e.g. `RAILS_MASTER_KEY`, `SENDGRID_API_KEY`) go in a `.env` file.

### Environment variables

Every secret can come from `RAILS_MASTER_KEY` + `config/credentials.yml.enc` or be overridden with an environment variable:

| Variable | Purpose |
|---|---|
| `RAILS_MASTER_KEY` | decrypts `config/credentials.yml.enc` (GCS keys, Facebook, LINE, ...) |
| `SECRET_KEY_BASE` | overrides `credentials.secret_key_base` |
| `DATABASE_URL` | PostgreSQL connection |
| `REDIS_URL` | Sidekiq and Action Cable |
| `SENDGRID_API_KEY` | outgoing mail |
| `APP_HOST` | host used in mail links (default `caten-church.org`) |
| `ACTIVE_STORAGE_SERVICE` | `production` (GCS, default) or `local` |
| `ACTIVE_JOB_QUEUE_ADAPTER` | Active Job backend in production: `async` (default, runs jobs in the web process) or `sidekiq` (needs a Sidekiq worker and Redis; `docker-compose.yml` uses this) |
| `SKIP_REQUIRED_SETTINGS_CHECK=1` | boot production without the required settings check (`config/initializers/required_settings.rb`); used by `docker-compose.yml`, which runs without real secrets |
| `RAILS_ASSUME_SSL` | `true` by default (TLS terminated by the proxy) |
| `RAILS_FORCE_SSL` | `false` by default; `true` redirects to HTTPS and sends HSTS (2 years, including subdomains — browsers keep it even after turning it off) |
| `MAILER_SENDER`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_PAGE_ID`, `FACEBOOK_MESSAGE_TOKEN`, `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_TOKEN`, `GA_TRACK_ID` | optional overrides of the matching credentials |
| `DB_PREPARE=true` | run `rails db:prepare` when the container starts |

## CI / CD

GitHub Actions (`.github/workflows/ci.yml`):

- **Test** — RSpec against PostgreSQL and Redis service containers, ESLint, asset build
- **Security scan** — Brakeman (report only for now)
- **Build image** — builds on every run, pushes to `ghcr.io/catenchurch/caten-church` on `master` and `v*` tags
  (tags: `sha-<short>`, `master`, `latest`, and `X.Y.Z` / `X.Y` for releases)

`Update lockfiles` (`.github/workflows/lockfiles.yml`) regenerates `Gemfile.lock` and
`package-lock.json` when `Gemfile`/`package.json` change on a branch (or manually on the selected branch),
re-resolving only what changed, then dispatches CI for the new commit. Dependabot keeps gems, npm packages, actions and base images up to date.

## Heroku

Before deploying this version to an existing Heroku app:

- Production refuses to boot when a required setting is missing (database, SendGrid, Facebook, LINE, GCS keys, `secret_key_base`; see `config/initializers/required_settings.rb`).
  On Heroku the check also runs during `assets:precompile`, so a missing setting fails the build and the running release is kept.

- Assets are built with npm (jsbundling/cssbundling), so the app needs Node.js during `assets:precompile`.
  Add the Node.js buildpack in front of the Ruby one:

  ```sh
  heroku buildpacks:add --index 1 heroku/nodejs --app $APP_NAME
  heroku buildpacks --app $APP_NAME # heroku/nodejs, then heroku/ruby
  ```

- Production runs Active Job in the web dyno (`ACTIVE_JOB_QUEUE_ADAPTER` defaults to `async`), so no worker dyno or Redis is needed.
  If you switch to `sidekiq`, Sidekiq 8 needs Redis 7.0 or newer:

  ```sh
  heroku redis:info --app $APP_NAME
  ```

Dumping database to local

```sh
heroku pg:pull DATABASE_URL postgres://$USERNAME:$PASSWORD@$HOST:$PORT/$DB_NAME --app $APP_NAME
```

Migrate heroku database

```sh
heroku run rails db:migrate
```
