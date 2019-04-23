# frozen_string_literal: true

url = Rails.application.credentials.dig(Rails.env.to_sym, :redis_url) ||
      ENV['REDIS_URL'] ||
      'redis://localhost:6379/1'

Sidekiq.configure_server do |config|
  config.redis = { url: url }
end

Sidekiq.configure_client do |config|
  config.redis = { url: url }
end

# Connection pool with Redis
# read: https://github.com/mperham/sidekiq/wiki/Using-Redis#complete-control
#
# redis_conn = proc {
#   Redis.new(url: ENV['REDIS_URL'])
# }
# Sidekiq.configure_client do |config|
#   config.redis = ConnectionPool.new(size: 5, &redis_conn)
# end
# Sidekiq.configure_server do |config|
#   config.redis = ConnectionPool.new(size: 25, &redis_conn)
# end
