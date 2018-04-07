Sidekiq.configure_server do |config|
  config.redis = { url: ENV['REDIS_URL'] }
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV['REDIS_URL'] }
end

# Set Redis url to ENV['REDIS_PROVIDER'], and Sidekiq will use it without spec
# Redis.new(url: ENV['REDIS_PROVIDER']) = Redis.new if ENV['REDIS_PROVIDER'] have value
# read: https://github.com/mperham/sidekiq/wiki/Using-Redis#using-an-env-variable


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
