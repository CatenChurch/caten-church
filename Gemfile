# frozen_string_literal: true

source 'https://rubygems.org'

# SEO
gem 'meta-tags' # Meta Tags, https://github.com/kpumuk/meta-tags
gem 'sitemap_generator' # Sitemap, https://github.com/kjvarga/sitemap_generator

# Oauth2
gem 'omniauth' # Omniauth, https://github.com/omniauth/omniauth
gem 'omniauth-facebook' # Facebook Omniauth, https://github.com/mkdynamic/omniauth-facebook

# Markdown
gem 'pagedown-bootstrap-rails' # Markdown Editor, https://github.com/hughevans/pagedown-bootstrap-rails
gem 'redcarpet' # Markdown to Html, https://github.com/vmg/redcarpet, see https://ruby-china.org/topics/474

# API
gem 'koala' # Facebook Graph API, https://github.com/arsduo/koala
gem 'line-bot-api' # Line Bot, https://github.com/line/line-bot-sdk-ruby
gem 'line-bot-message-builder', '~> 0.1.1' # Line Messaging API, https://github.com/jk195417/line-bot-message-builder

# Assets
gem 'font-awesome-sass', '~> 5.8.1' # Icon
gem 'webpacker', '~> 4.2.2'

# Features
gem 'cancancan' # Authorization, https://github.com/CanCanCommunity/cancancan
gem 'caxlsx_rails' # Excel, https://github.com/caxlsx/caxlsx_rails
gem 'devise' # User Login, https://github.com/plataformatec/devise
gem 'kaminari' # Pagination, https://github.com/kaminari/kaminari, $ rails g kaminari:views bootstrap4
gem 'ransack' # Searching, https://github.com/activerecord-hackery/ransack
gem 'rolify' # Role management, https://github.com/RolifyCommunity/rolify
gem 'sidekiq' # Job Workers, https://github.com/mperham/sidekiq
gem 'simple_form' # From, https://github.com/plataformatec/simple_form

# I18n
gem 'devise-i18n'
gem 'rails-i18n'

# Speed up application
gem 'bootsnap', require: false

# Default
gem 'pg', '~> 1.1' # Use postgresql as the database for Active Record
gem 'puma', '~> 4.3' # Use Puma as the app server
gem 'rails', '~> 6.0' # Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'sass-rails', '~> 5.0' # Use SCSS for stylesheets
# gem 'therubyracer', platforms: :ruby # See https://github.com/rails/execjs#readme for more supported runtimes

# Default Assets
gem 'coffee-rails' # Use CoffeeScript for .coffee assets and views
gem 'jbuilder', '~> 2.8' # Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'redis' # Use Redis adapter to run Action Cable in production
gem 'turbolinks', '~> 5.2' # Turbolinks makes navigating your web application faster. Read more: https://github.com/turbolinks/turbolinks
# gem 'bcrypt', '~> 3.1.7' # Use ActiveModel has_secure_password

# Default Deploy
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
  gem 'rspec-rails', '~> 3.5' # Rspec
end

group :development do
  # Document
  gem 'rails-erd' # ER Model Dialogue https://github.com/voormedia/rails-erd

  # Security
  gem 'brakeman', require: false # brakeman

  # Debugger
  gem 'better_errors'
  gem 'binding_of_caller'
  gem 'web-console', '~> 3.7.0' # Access an IRB console on exception pages or by using <%= console %> anywhere in the code.

  # Hot Reload
  gem 'listen', '>= 3.1', '< 3.2' # config.file_watcher = ActiveSupport::EventedFileUpdateChecker depends on this gem.
  gem 'spring' # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring-watcher-listen' # This gem makes Spring watch the filesystem for changes using Listen rather than by polling the filesystem.
end
