# frozen_string_literal: true

# This configuration file will be evaluated by Puma. The top-level methods that
# are invoked here are part of Puma's configuration DSL. For more information
# about methods provided by the DSL, see https://puma.io/puma/Puma/DSL.html.

# Puma serves each request in a thread from an internal thread pool. Keep the
# thread count at or below the database pool size (config/database.yml).
threads_count = ENV.fetch('RAILS_MAX_THREADS', 5)
threads threads_count, threads_count

rails_env = ENV.fetch('RAILS_ENV', 'development')
port_number = ENV.fetch('PORT', 3000)

# Using mkcert self-signed cert, to enable SSL at https://localhost:3000 (see README).
ssl_cert = File.expand_path('ssl/localhost.pem', __dir__)
ssl_key = File.expand_path('ssl/localhost-key.pem', __dir__)
if rails_env == 'development' && File.exist?(ssl_cert) && File.exist?(ssl_key)
  ssl_bind '0.0.0.0', port_number, cert: ssl_cert, key: ssl_key
else
  port port_number
end

# Specifies the number of `workers` to boot in clustered mode. Leave at 0 inside
# containers and scale with more pods instead.
workers ENV.fetch('WEB_CONCURRENCY', 0).to_i

# Allow puma to be restarted by `bin/rails restart` command.
plugin :tmp_restart

# Specify the PID file. Defaults to tmp/pids/server.pid in development.
# In other environments, only set the PID file if requested.
pidfile ENV['PIDFILE'] if ENV['PIDFILE']
