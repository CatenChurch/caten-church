# frozen_string_literal: true

source 'https://rubygems.org'

ruby '~> 3.4'

# Rails
gem 'rails', '~> 8.1.0'

# Booting Web Server
gem 'bootsnap', require: false # Speed up application boot
gem 'puma', '>= 6.6' # Use Puma as the app server
gem 'thruster', require: false # HTTP asset caching/compression and X-Sendfile in front of Puma

# Database
gem 'pg', '~> 1.5' # Use postgresql as the database for Active Record
gem 'redis', '~> 5.0' # Action Cable redis adapter

# Assets (replaces Webpacker)
gem 'cssbundling-rails' # Sass build for Bootstrap 5, https://github.com/rails/cssbundling-rails
gem 'jsbundling-rails' # esbuild, https://github.com/rails/jsbundling-rails
gem 'propshaft' # Asset pipeline, https://github.com/rails/propshaft
gem 'turbo-rails' # Hotwire Turbo (replaces Turbolinks and rails-ujs)

# Auth
gem 'cancancan', '~> 3.4' # Authorization, https://github.com/CanCanCommunity/cancancan
gem 'devise', '>= 4.9.4' # User Login, https://github.com/heartcombo/devise
gem 'rolify', '~> 6.0' # Role management, https://github.com/RolifyCommunity/rolify

# Oauth2
gem 'omniauth', '~> 2.1' # Omniauth, https://github.com/omniauth/omniauth
gem 'omniauth-facebook', '>= 9.0' # Facebook Omniauth, https://github.com/simi/omniauth-facebook
# Omniauth & Rails CSRF intergration, https://github.com/cookpad/omniauth-rails_csrf_protection
gem 'omniauth-rails_csrf_protection', '>= 1.0.1'

# SEO
gem 'meta-tags', '~> 2.18' # Meta Tags, https://github.com/kpumuk/meta-tags
gem 'sitemap_generator', '~> 6.3' # Sitemap, https://github.com/kjvarga/sitemap_generator

# I18n
gem 'devise-i18n', '~> 1.11' # https://github.com/tigrish/devise-i18n
gem 'rails-i18n', '~> 8.0' # https://github.com/svenfuchs/rails-i18n

# Facebook
gem 'koala', '~> 3.4' # Facebook Graph API, https://github.com/arsduo/koala

# Line
# Stay on the 1.x SDK: 2.x is a rewrite of the client API used by LineBotService.
gem 'line-bot-api', '~> 1.27' # Line Bot, https://github.com/line/line-bot-sdk-ruby
gem 'line-bot-message-builder', '~> 0.1.2' # Line Messaging API, https://github.com/jk195417/line-bot-message-builder

# Others
gem 'caxlsx_rails', '~> 0.6.3' # Excel, https://github.com/caxlsx/caxlsx_rails
gem 'google-cloud-storage', '~> 1.44' # Active Storage provider
gem 'jbuilder', '~> 2.11' # Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'kaminari', '~> 1.2' # Pagination, https://github.com/kaminari/kaminari
gem 'ransack', '~> 4.0' # Searching, https://github.com/activerecord-hackery/ransack
gem 'sidekiq', '~> 8.0' # Job Workers, https://github.com/sidekiq/sidekiq
gem 'simple_form', '~> 5.2' # Form, https://github.com/heartcombo/simple_form

group :development, :test do
  # Debugger
  gem 'debug', platforms: %i[mri windows], require: 'debug/prelude'
  gem 'pry', '>= 0.14.2'
  gem 'pry-nav', '>= 1.0.0'
  gem 'pry-rails', '>= 0.3.9'

  # Security
  gem 'brakeman', require: false # Static analysis for security vulnerabilities

  # Test
  gem 'factory_bot_rails', '~> 6.2' # Factory Bot
  gem 'faker', '~> 3.1' # Fake Data
  gem 'rspec-rails', '>= 7.0' # Rspec
end

group :development do
  # Formatter
  gem 'htmlbeautifier', '~> 1.4' # ERB Formatter
  gem 'rubocop', require: false # Ruby Formatter

  # Auto complete
  gem 'solargraph', require: false # Language server

  # Database Migration
  gem 'squasher', '>= 0.7.1' # Squash migration

  # Document
  gem 'rails-erd', '~> 1.7' # ER Model Dialogue https://github.com/voormedia/rails-erd

  # Debugger
  gem 'better_errors', '~> 2.9'
  gem 'binding_of_caller', '~> 1.0'
  gem 'web-console', '>= 4.2' # Access an IRB console on exception pages or by using <%= console %> anywhere in the code.

  # Process manager for bin/dev
  gem 'foreman', require: false
end
