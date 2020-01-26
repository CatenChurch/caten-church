# frozen_string_literal: true
ruby "2.7.0"
source 'https://rubygems.org'

# SEO
gem 'meta-tags', '~> 2.13' # Meta Tags, https://github.com/kpumuk/meta-tags
gem 'sitemap_generator', '~> 6.1' # Sitemap, https://github.com/kjvarga/sitemap_generator

# Oauth2
gem 'omniauth', '~> 1.9' # Omniauth, https://github.com/omniauth/omniauth
gem 'omniauth-facebook', '~> 5.0' # Facebook Omniauth, https://github.com/mkdynamic/omniauth-facebook

# Markdown
gem 'pagedown-bootstrap-rails', '~> 2.1' # Markdown Editor, https://github.com/hughevans/pagedown-bootstrap-rails
gem 'redcarpet', '~> 3.5' # Markdown to HTML, https://github.com/vmg/redcarpet, see https://ruby-china.org/topics/474

# API
gem 'koala', '~> 3.0' # Facebook Graph API, https://github.com/arsduo/koala
gem 'line-bot-api', '~> 1.13' # Line Bot, https://github.com/line/line-bot-sdk-ruby
gem 'line-bot-message-builder', '~> 0.1.1' # Line Messaging API, https://github.com/jk195417/line-bot-message-builder

# Assets
gem 'font-awesome-sass', '~> 5.8.1' # Icon
gem 'webpacker', '~> 4.2.2'

# Features
gem 'cancancan', '~> 3.0' # Authorization, https://github.com/CanCanCommunity/cancancan
gem 'caxlsx_rails', '~> 0.6' # Excel, https://github.com/caxlsx/caxlsx_rails
gem 'devise', '~> 4.7' # User Login, https://github.com/plataformatec/devise
gem 'kaminari', '~> 1.1' # Pagination, https://github.com/kaminari/kaminari, $ rails g kaminari:views bootstrap4
gem 'ransack', '~> 2.3' # Searching, https://github.com/activerecord-hackery/ransack
gem 'rolify', '~> 5.2' # Role management, https://github.com/RolifyCommunity/rolify
gem 'sidekiq', '~> 6.0' # Job Workers, https://github.com/mperham/sidekiq
gem 'simple_form', '~> 5.0' # From, https://github.com/plataformatec/simple_form

# I18n
gem 'devise-i18n', '~> 1.9'
gem 'rails-i18n', '~> 6.0'

# Speed up application
gem 'bootsnap', '~> 1.4', require: false

# Default
gem 'pg', '~> 1.2' # Use postgresql as the database for Active Record
gem 'puma', '~> 4.3' # Use Puma as the app server
gem 'rails', '~> 6.0' # Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'sass-rails', '~> 6.0' # Use SCSS for stylesheets
# gem 'therubyracer', platforms: :ruby # See https://github.com/rails/execjs#readme for more supported runtimes

# Default Assets
gem 'coffee-rails', '~> 5.0' # Use CoffeeScript for .coffee assets and views
gem 'jbuilder', '~> 2.9' # Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'redis', '~> 4.1' # Use Redis adapter to run Action Cable in production
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
  gem 'rspec-rails' # Rspec
end

group :development do
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
