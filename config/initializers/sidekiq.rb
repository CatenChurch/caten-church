# frozen_string_literal: true

url = ENV['REDIS_URL'] ||
      Rails.application.credentials.dig(Rails.env.to_sym, :redis_url) ||
      'redis://localhost:6379/1'

Sidekiq.configure_server do |config|
  config.redis = { url: url }
end

Sidekiq.configure_client do |config|
  config.redis = { url: url }
end
