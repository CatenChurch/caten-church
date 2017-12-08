Deploy Rails application to Heroku see <https://devcenter.heroku.com/articles/getting-started-with-rails5>

# Setup

首先進入專案的資料夾下

```bash
cd CatenChurch
```

Login heroku first

```bash
$ heroku login
```

以前 Rails application 部署到 Heroku 需要安裝一個 gem [rails_12factor](https://github.com/heroku/rails_12factor) 處理 assets 與 logs。<br>
現在我們只需要在 `config/environments/production.rb` 加上

```ruby
# config/environments/production.rb
config.public_file_server.enabled = ENV['RAILS_SERVE_STATIC_FILES'].present?
if ENV["RAILS_LOG_TO_STDOUT"].present?
  logger           = ActiveSupport::Logger.new(STDOUT)
  logger.formatter = config.log_formatter
  config.logger = ActiveSupport::TaggedLogging.new(logger)
end
```

在 `Gemfile` 最後一行加上，指定 Ruby 版本

```ruby
# Gemfile
# for heroku
group :production do
  ruby '~> 2.3.0'
end
```

## Git

Heroku 使用 git 部署，當你把程式 push 到 Heroku 的 remote 時，Heroku 會開始一連串的自動化部署

所以還沒有 git 的專案，需初始化 git

```
$ git init
```

這邊就不詳談 git 的使用

建立一個 Heroku app 並且設定好 Heroku 的 remote git url，已經有 Heroku app 者請跳過這個步驟

```bash
$ heroku create
```

查看 Heroku remote git url

```bash
$ git config --list | grep heroku
```

## Database

`Gemfile` add

```ruby
gem pg
```

修改 `config/database.yml` user_name 不用填，password 留空

```yml
production:
   adapter: postgresql
   encoding: unicode
   password:
```

## Procfile and Dyno

新增一個 `Procfile` 在 `CatenChurch` 資料夾下

```
# Procfile
web: bundle exec puma -C config/puma.rb
sidekid: bundle exec sidekiq -C config/sidekiq.yml
```

這邊 `Puma` 使用了 `config/puma.rb` 的設定，`sidekiq` 使用了 `config/sidekiq.yml` 的設定

請參考 [Puma](#) 與 [Sidekiq](#)

open web dyno and sidekid worker

```bash
$ heroku ps:scale web=1
$ heroku ps:scale sidekid=1
```

## ENV values 環境變數

by heroku cli

```bash
heroku config:set key=value
```

by figaro

```bash
$ figaro heroku:set -e production
```

by heruku web dashboard Setting > Reveal Config Vars

# Deploy

push 程式碼之前，確定想要的更動都已經 commit 在 master 分支內。

```bash
$ git push heroku master
```

Heroku 會用 production 環境開始部署應用程式

若有新增 migration 需要執行以下指令，以 migrate db

```bash
$ heroku run rake db:migrate
```

若有更改 `config/application.yml` 需要執行以下指令

```
$ figaro heroku:set -e production
```

用瀏覽器開啟 app

```bash
$ heroku open
```

## 常用指令

查看 Logs

```bash
$ heroku logs --tail
```

連入 Postgres

```bash
# use psql
$ psql $(heroku config:get DATABASE_URL)
# use pgcli
$ pgcli $(heroku config:get DATABASE_URL)
# use rails db:console
$ heroku run rails db:console
```

看有哪些 dyno

```bash
$ heroku ps:scale
```

部署指令 deploy to heroku

```bash
$ git push heroku master
$ heroku run rake db:migrate
```

查看 Heroku production 環境變數

```bash
$ heroku config
```

設定 Heroku production 環境變數

```bash
# by heroku cli
heroku config:set key=value
# by figaro push config/application.yml to server
$ figaro heroku:set -e production
# by heruku web dashboard Setting > Reveal Config Vars
```

備份 db 到本地的 local_db_name

```bash
$ heroku pg:pull DATABASE_URL localDbName --app caten-church
```
