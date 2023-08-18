# frozen_string_literal: true

ruby '3.2.1'

source 'https://rubygems.org'

# Rails
gem 'rails', '~> 6.1.7' # Bundle edge Rails instead: gem 'rails', github: 'rails/rails'

# Booting Web Server
gem 'bootsnap', '~> 1.16.0', require: false # Speed up application
gem 'puma', '~> 6.3.1' # Use Puma as the app server

# Database
gem 'pg', '~> 1.4.6' # Use postgresql as the database for Active Record
gem 'redis', '~> 5.0.6' # Use Redis as cache and message queue

# Assets
gem 'webpacker', '~> 5.4.4' # https://github.com/rails/webpacker

# Auth
gem 'cancancan', '~> 3.4.0' # Authorization, https://github.com/CanCanCommunity/cancancan
gem 'devise', '~> 4.9.0' # User Login, https://github.com/plataformatec/devise
gem 'rolify', '~> 6.0.1' # Role management, https://github.com/RolifyCommunity/rolify

# Oauth2
gem 'omniauth', '~> 2.1.1' # Omniauth, https://github.com/omniauth/omniauth
gem 'omniauth-facebook', '~> 9.0.0' # Facebook Omniauth, https://github.com/mkdynamic/omniauth-facebook
# Omniauth & Rails CSRF intergration, https://github.com/cookpad/omniauth-rails_csrf_protection
# See: https://github.com/omniauth/omniauth/wiki/Upgrading-to-2.0#rails
gem 'omniauth-rails_csrf_protection', '~> 1.0.1'

# SEO
gem 'meta-tags', '~> 2.18.0' # Meta Tags, https://github.com/kpumuk/meta-tags
gem 'sitemap_generator', '~> 6.3.0' # Sitemap, https://github.com/kjvarga/sitemap_generator

# I18n
gem 'devise-i18n', '~> 1.11.0' # https://github.com/tigrish/devise-i18n
gem 'rails-i18n', '~> 6.0' # https://github.com/svenfuchs/rails-i18n

# Facebook
gem 'koala', '~> 3.4.0' # Facebook Graph API, https://github.com/arsduo/koala

# Line
gem 'line-bot-api', '~> 1.27.0' # Line Bot, https://github.com/line/line-bot-sdk-ruby
gem 'line-bot-message-builder', '~> 0.1.2' # Line Messaging API, https://github.com/jk195417/line-bot-message-builder

# Others
gem 'caxlsx_rails', '~> 0.6.3' # Excel, https://github.com/caxlsx/caxlsx_rails
gem 'google-cloud-storage', '~> 1.44.0' # Active Storage provider, https://github.com/googleapis/google-cloud-ruby/tree/master/google-cloud-storage
gem 'jbuilder', '~> 2.11.5' # Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'kaminari', '~> 1.2.2' # Pagination, https://github.com/kaminari/kaminari, $ rails g kaminari:views bootstrap4
gem 'ransack', '~> 2.6.0' # Searching, https://github.com/activerecord-hackery/ransack
gem 'sidekiq', '~> 7.0.6' # Job Workers, https://github.com/mperham/sidekiq
gem 'simple_form', '~> 5.2.0' # From, https://github.com/plataformatec/simple_form

# gem 'therubyracer', platforms: :ruby # See https://github.com/rails/execjs#readme for more supported runtimes
# gem 'bcrypt', '~> 3.1.7' # Use ActiveModel has_secure_password
# gem 'capistrano-rails', group: :development # Use Capistrano for deployment

group :development, :test do
  # Debugger
  gem 'byebug', '~> 11.1.3', platforms: %i[mri mingw x64_mingw] # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'pry', '~> 0.14.2'
  gem 'pry-nav', '~> 1.0.0'
  gem 'pry-rails', '~> 0.3.9'

  # Test
  gem 'factory_bot_rails', '~> 6.2.0' # Factory Bot
  gem 'faker', '~> 3.1.1' # Fake Data
  gem 'rspec-rails', '~> 6.0.1' # Rspec
end

group :development do
  # Formatter
  gem 'htmlbeautifier', '~> 1.4.2' # ERB Formatter
  gem 'rubocop', '~> 1.46.0' # Ruby Formatter

  # Auto complete
  gem 'solargraph', '~> 0.48.0' # Language server

  # Database Migration
  gem 'squasher', '~> 0.7.1' # Squash migration

  # Document
  gem 'rails-erd', '~> 1.7.2' # ER Model Dialogue https://github.com/voormedia/rails-erd

  # Security
  gem 'brakeman', '~> 5.4.1', require: false # brakeman

  # Debugger
  gem 'better_errors', '~> 2.9.1'
  gem 'binding_of_caller', '~> 1.0.0'
  gem 'web-console', '~> 4.2.0' # Access an IRB console on exception pages or by using <%= console %> anywhere in the code.

  # Hot Reload
  gem 'listen', '~> 3.8.0' # config.file_watcher = ActiveSupport::EventedFileUpdateChecker depends on this gem.
  gem 'spring', '~> 4.1.1' # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring-watcher-listen', '~> 2.1.0' # This gem makes Spring watch the filesystem for changes using Listen rather than by polling the filesystem.
end
