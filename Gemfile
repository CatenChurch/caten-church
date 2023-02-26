# frozen_string_literal: true

ruby '2.7.1'
source 'https://rubygems.org'

# Rails
gem 'rails', '~> 6.0' # Bundle edge Rails instead: gem 'rails', github: 'rails/rails'

# Booting Web Server
gem 'bootsnap', '~> 1.4', require: false # Speed up application
gem 'puma', '~> 4.3' # Use Puma as the app server

# Database
gem 'pg', '~> 1.2' # Use postgresql as the database for Active Record
gem 'redis', '~> 4.1' # Use Redis as cache and message queue

# Assets
gem 'webpacker', '~> 5.x'

# Auth
gem 'cancancan', '~> 3.0' # Authorization, https://github.com/CanCanCommunity/cancancan
gem 'devise', '~> 4.9' # User Login, https://github.com/plataformatec/devise
gem 'rolify', '~> 5.2' # Role management, https://github.com/RolifyCommunity/rolify

# Oauth2
gem 'omniauth', '~> 2.0' # Omniauth, https://github.com/omniauth/omniauth
gem 'omniauth-facebook', '~> 5.0' # Facebook Omniauth, https://github.com/mkdynamic/omniauth-facebook

# SEO
gem 'meta-tags', '~> 2.13' # Meta Tags, https://github.com/kpumuk/meta-tags
gem 'sitemap_generator', '~> 6.1' # Sitemap, https://github.com/kjvarga/sitemap_generator

# I18n
gem 'devise-i18n', '~> 1.9'
gem 'rails-i18n', '~> 6.0'

# Facebook
gem 'koala', '~> 3.0' # Facebook Graph API, https://github.com/arsduo/koala

# Line
gem 'line-bot-api', '~> 1.13' # Line Bot, https://github.com/line/line-bot-sdk-ruby
gem 'line-bot-message-builder', '~> 0.1.1' # Line Messaging API, https://github.com/jk195417/line-bot-message-builder

# Others
gem 'caxlsx_rails', '~> 0.6' # Excel, https://github.com/caxlsx/caxlsx_rails
gem 'google-cloud-storage', '~> 1.25' # Active Storage provider, https://github.com/googleapis/google-cloud-ruby/tree/master/google-cloud-storage
gem 'jbuilder', '~> 2.9' # Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'kaminari', '~> 1.2' # Pagination, https://github.com/kaminari/kaminari, $ rails g kaminari:views bootstrap4
gem 'ransack', '~> 2.3' # Searching, https://github.com/activerecord-hackery/ransack
gem 'sidekiq', '~> 6.4' # Job Workers, https://github.com/mperham/sidekiq
gem 'simple_form', '~> 5.0' # From, https://github.com/plataformatec/simple_form

# gem 'therubyracer', platforms: :ruby # See https://github.com/rails/execjs#readme for more supported runtimes
# gem 'bcrypt', '~> 3.1.7' # Use ActiveModel has_secure_password
# gem 'capistrano-rails', group: :development # Use Capistrano for deployment

group :development, :test do
  # Debugger
  gem 'byebug', platforms: %i[mri mingw x64_mingw] # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'pry'
  gem 'pry-nav'
  gem 'pry-rails'

  # Test
  gem 'factory_bot_rails' # Factory Bot
  gem 'faker' # Fake Data
  gem 'rspec-rails' # Rspec
end

group :development do
  # Formatter
  gem 'htmlbeautifier' # ERB Formatter
  gem 'rubocop' # Ruby Formatter

  # Auto complete
  gem 'solargraph' # Language server

  # Database Migration
  gem 'squasher' # Squash migration

  # Document
  gem 'rails-erd' # ER Model Dialogue https://github.com/voormedia/rails-erd

  # Security
  gem 'brakeman', require: false # brakeman

  # Debugger
  gem 'better_errors'
  gem 'binding_of_caller'
  gem 'web-console' # Access an IRB console on exception pages or by using <%= console %> anywhere in the code.

  # Hot Reload
  gem 'listen' # config.file_watcher = ActiveSupport::EventedFileUpdateChecker depends on this gem.
  gem 'spring' # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring-watcher-listen' # This gem makes Spring watch the filesystem for changes using Listen rather than by polling the filesystem.
end
