# frozen_string_literal: true

require 'active_support/core_ext/integer/time'

Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # Code is not reloaded between requests.
  config.enable_reloading = false

  # Eager load code on boot for better performance and memory savings (ignored by Rake tasks).
  config.eager_load = true

  # Full error reports are disabled.
  config.consider_all_requests_local = false

  # Turn on fragment caching in view templates.
  config.action_controller.perform_caching = true

  # Cache assets for far-future expiry since they are all digest stamped.
  config.public_file_server.headers = { 'cache-control' => "public, max-age=#{1.year.to_i}" }

  # Enable serving of images, stylesheets, and JavaScripts from an asset server.
  # config.asset_host = "http://assets.example.com"

  # Store uploaded files on Google Cloud Storage (see config/storage.yml for options).
  config.active_storage.service = ENV.fetch('ACTIVE_STORAGE_SERVICE', 'production').to_sym

  # The app runs behind a TLS-terminating proxy (Cloudflare, Heroku router).
  # Set RAILS_ASSUME_SSL to "false" to serve plain HTTP.
  config.assume_ssl = ENV.fetch('RAILS_ASSUME_SSL', 'true') == 'true'

  # Off by default for now: force_ssl also sends HSTS (2 years, including subdomains), which
  # browsers keep even if it is turned off later. Set RAILS_FORCE_SSL=true to redirect to HTTPS.
  config.force_ssl = ENV.fetch('RAILS_FORCE_SSL', 'false') == 'true'

  # Skip http-to-https redirect for the default health check endpoint.
  config.ssl_options = { redirect: { exclude: ->(request) { request.path == '/up' } } }

  # Log to STDOUT with the current request id as a default log tag.
  config.log_tags = [:request_id]
  config.logger = ActiveSupport::TaggedLogging.logger($stdout)

  # Change to "debug" to log everything (including potentially personally-identifiable information!).
  config.log_level = ENV.fetch('RAILS_LOG_LEVEL', 'info')

  # Prevent health checks from clogging up the logs.
  config.silence_healthcheck_path = '/up'

  # Don't log any deprecations.
  config.active_support.report_deprecations = false

  # Replace the default in-process memory cache store with a durable alternative.
  # config.cache_store = :mem_cache_store

  # Run Active Job in-process by default: Heroku runs no worker dyno, so jobs sent to Sidekiq
  # (e.g. Active Storage purges when a weekly PDF is replaced or deleted) were never processed,
  # and enqueueing raised whenever Redis was unreachable.
  # Set ACTIVE_JOB_QUEUE_ADAPTER=sidekiq where a Sidekiq worker and Redis are running.
  config.active_job.queue_adapter = ENV.fetch('ACTIVE_JOB_QUEUE_ADAPTER', 'async').to_sym

  # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
  # the I18n.default_locale when a translation cannot be found).
  config.i18n.fallbacks = true

  # Do not dump schema after migrations.
  config.active_record.dump_schema_after_migration = false

  # Only use :id for inspections in production.
  config.active_record.attributes_for_inspect = [:id]

  # Sendgrid mailer.
  app_host = ENV.fetch('APP_HOST', 'caten-church.org')
  config.action_mailer.delivery_method = :smtp
  config.action_mailer.perform_caching = false
  config.action_mailer.perform_deliveries = true
  config.action_mailer.raise_delivery_errors = true
  config.action_mailer.default_url_options = { host: app_host, protocol: 'https' }
  config.action_mailer.smtp_settings = {
    user_name: 'apikey',
    password: ENV['SENDGRID_API_KEY'] || Rails.application.credentials.dig(:sendgrid, :api_key),
    domain: 'caten-church.org',
    address: 'smtp.sendgrid.net',
    port: 587,
    authentication: :plain,
    enable_starttls_auto: true
  }

  # Enable DNS rebinding protection and other `Host` header attacks.
  # config.hosts = [
  #   "example.com",     # Allow requests from example.com
  #   /.*\.example\.com/ # Allow requests from subdomains like `www.example.com`
  # ]
  # Skip DNS rebinding protection for the default health check endpoint.
  # config.host_authorization = { exclude: ->(request) { request.path == "/up" } }
end
