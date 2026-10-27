# frozen_string_literal: true

# Fail fast in production when a setting the app needs is missing.
# Rails 6.1 crashed at boot on missing credentials; lookups now return nil instead (so development
# works without config/master.key), which would let a misconfigured release boot and fail later.
# On Heroku this also runs during assets:precompile, so the build fails before the release goes out.
# Skipped for SECRET_KEY_BASE_DUMMY builds (Dockerfile) and with SKIP_REQUIRED_SETTINGS_CHECK=1
# (the local docker-compose stack, which runs without real secrets).
if Rails.env.production? && ENV['SECRET_KEY_BASE_DUMMY'].blank? && ENV['SKIP_REQUIRED_SETTINGS_CHECK'].blank?
  credentials = Rails.application.credentials
  required = {
    'DATABASE_URL (or credentials production.database_url)' =>
      ENV['DATABASE_URL'] || credentials.dig(:production, :database_url),
    'SENDGRID_API_KEY (or credentials sendgrid.api_key)' =>
      ENV['SENDGRID_API_KEY'] || credentials.dig(:sendgrid, :api_key),
    'FACEBOOK_APP_ID (or credentials facebook.app_id)' =>
      ENV['FACEBOOK_APP_ID'] || credentials.dig(:facebook, :app_id),
    'FACEBOOK_APP_SECRET (or credentials facebook.app_secret)' =>
      ENV['FACEBOOK_APP_SECRET'] || credentials.dig(:facebook, :app_secret),
    'LINE_CHANNEL_SECRET (or credentials line.channel_secret)' =>
      ENV['LINE_CHANNEL_SECRET'] || credentials.dig(:line, :channel_secret),
    'LINE_CHANNEL_TOKEN (or credentials line.channel_token)' =>
      ENV['LINE_CHANNEL_TOKEN'] || credentials.dig(:line, :channel_token)
  }
  if Rails.application.config.active_storage.service == :production
    %i[project_id private_key client_email].each do |key|
      required["credentials gcs.#{key} (for ACTIVE_STORAGE_SERVICE=production)"] = credentials.dig(:gcs, key)
    end
  end

  missing = required.select { |_name, value| value.blank? }.keys
  raise "Missing required production settings: #{missing.join(', ')}" if missing.any?

  # Raises when neither SECRET_KEY_BASE nor credentials.secret_key_base is set
  Rails.application.secret_key_base
end
