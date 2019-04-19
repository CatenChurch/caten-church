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

# Outside Services
gem 'newrelic_rpm' # New Relic Monitoring, https://github.com/newrelic/rpm

# Assets
gem 'font-awesome-rails' # Icon

# Features
gem 'kaminari' # Pagination, https://github.com/kaminari/kaminari, $ rails g kaminari:views bootstrap4
gem 'ransack' # Searching, https://github.com/activerecord-hackery/ransack
gem 'simple_form' # From, https://github.com/plataformatec/simple_form
gem 'devise' # User Login, https://github.com/plataformatec/devise
gem 'cancancan' # Authorization, https://github.com/CanCanCommunity/cancancan
gem 'rolify' # Role management, https://github.com/RolifyCommunity/rolify
gem 'rubyzip', '>= 1.2.1' # Excel, https://github.com/straydogstudio/axlsx_rails
gem 'axlsx', git: 'https://github.com/randym/axlsx.git', ref: 'c8ac844' # Excel, https://github.com/straydogstudio/axlsx_rails
gem 'axlsx_rails' # Excel, https://github.com/straydogstudio/axlsx_rails
gem 'figaro' # ENV values, https://github.com/laserlemon/figaro
gem 'sidekiq' # Job Workers, https://github.com/mperham/sidekiq

# I18n
gem 'rails-i18n'
gem 'devise-i18n'

# Default
gem 'rails', '~> 5.1.4' # Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'pg', '~> 0.18' # Use postgresql as the database for Active Record
gem 'puma', '~> 3.7' # Use Puma as the app server
gem 'sass-rails', '~> 5.0' # Use SCSS for stylesheets
gem 'uglifier', '>= 1.3.0' # Use Uglifier as compressor for JavaScript assets
# gem 'therubyracer', platforms: :ruby # See https://github.com/rails/execjs#readme for more supported runtimes

# Default Assets
gem 'coffee-rails', '~> 4.2' # Use CoffeeScript for .coffee assets and views
gem 'turbolinks', '~> 5' # Turbolinks makes navigating your web application faster. Read more: https://github.com/turbolinks/turbolinks
gem 'jbuilder', '~> 2.7' # Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
# gem 'redis', '~> 3.0' # Use Redis adapter to run Action Cable in production
# gem 'bcrypt', '~> 3.1.7' # Use ActiveModel has_secure_password

# Default Deploy
# gem 'capistrano-rails', group: :development # Use Capistrano for deployment

group :development, :test do
  # Default
  gem 'byebug', platforms: [:mri, :mingw, :x64_mingw] # Call 'byebug' anywhere in the code to stop execution and get a debugger console

  # Test
  gem 'rspec-rails', '~> 3.5' # Rspec
  gem 'factory_bot_rails' # Factory Bot
  gem 'faker' # Fake Data

  # Doc
  gem 'rails-erd' # ER Model Dialogue https://github.com/voormedia/rails-erd
end

group :development do
  # Development Tools
  gem 'brakeman', require: false # brakeman
  gem 'pry-rails' # Pretty rails c

  # Default
  gem 'web-console', '>= 3.3.0' # Access an IRB console on exception pages or by using <%= console %> anywhere in the code.
  gem 'listen', '>= 3.0.5', '< 3.2' # config.file_watcher = ActiveSupport::EventedFileUpdateChecker depends on this gem.
  gem 'spring' # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring-watcher-listen', '~> 2.0.0'
end
