# CatenChurch
本專案為茄典教會網站，網址是<https://caten-church.com/>

專案的架構為 `Rails 5.0.1` + `Puma` + `Postgres 9.5.4.1` + `Heroku` + `Newrelic` + `Sidekiq` + `Redis`

- 前台
  - 帳號管理
  - 活動一覽
    - 報名活動
  - 公告一覽
  - 聯絡我們
- 後台管理員
  - 會員管理
  - 活動管理
  - 公告管理
  - 聯絡管理

## Setup

clone and bundle

```bash
$ git clone https://github.com/CatenChurch/CatenChurch.git
$ cd CatenChurch
$ bundle install
```

install database

```bash
$ brew install postgresql
$ brew install redis
```

setup config/database.yml

```yml
development:
  <<: *default
  database: 'your-database-name'
  username: 'your-user-name'
  password: 'your-user-password'
```

use figaro setup config/application.yml (see config/application.yml.example)

```yml
FB_APP_ID: "FB_APP_ID"
FB_APP_SECRET: "FB_APP_SECRET"
GOOGLE_API_KEY: "GOOGLE_API_KEY"
development:
  MAIL_USERNAME: "MAIL_USERNAME"
  MAIL_PASSWORD: "MAIL_PASSWORD"
  REDIS_URL: 'redis://127.0.0.1:6379/0'
production:
  MAIL_USERNAME: "MAIL_USERNAME"
  SENDGRID_USERNAME: "SENDGRID_USERNAME"
  SENDGRID_PASSWORD: "SENDGRID_PASSWORD"
  SENDGRID_API_KEY: "SENDGRID_API_KEY"
  REDIS_URL: 'REDISTOGO_URL'
```

create database

```bash
$ rails db:setup
$ rails db:migrate
```

run the server
```
puma -C config/puma.rb
```
and worker

```
sidekiq -C config/sidekiq.yml
```

## Development Tools

### node & nvm
install node & nvm via brew

```bash
$ brew install node
$ brew link node
$ brew install nvm
$ brew link nvm
$ brew info nvm
$ mkdir ~/.nvm
```

open ~/.bash_profile and add :

```
export NVM_DIR="$HOME/.nvm"
. "/usr/local/opt/nvm/nvm.sh"
```

### hotel.dev
install hotel via npm

```bash
$ npm install -g hotel
```

config proxy

https://github.com/typicode/hotel/blob/master/docs/README.md

osx :

```
Network Preferences > Advanced > Proxies > Automatic Proxy Configuration
```

url : http://localhost:2000/proxy.pac

usage

````bash
# start hotel
$ hotel start
# cd to project_path and add to hotel
$ cd project_path
$ hotel add 'rails server -p $PORT -b 127.0.0.1' -e GEM_PATH --name caten -p 3000
````

and got to localhost:2000 or hotel.dev

## Rails

### rake tasks

send birth notification mail to admin

```bash
$ rake mail:admin:birth_notification
```

### sitemap

add below line in Gemfile

```ruby
gem 'sitemap_generator'
```

usage

```bash
# init config/sitemap.rb
$ rake sitemap:install
# generate public/sitmap.xml
$ rake sitemap:refresh
```

add sitemap in public/robots.txt

```txt
sitemap: caten-church.com/sitemap.xml
```

### Reset counter cache

如果counter cache出錯了，則進入rails console用此方法重整

```ruby
# 例如想重整 event.id = 15 的 participants_count
Event.reset_counters 15, :participants
```

或使用 lib/tasks/counter_cache.rake 重整

```bash
$ rake counter_cache:reset_all
```

### sidekiq
https://github.com/mperham/sidekiq

```ruby
gem sidekiq
```

Use sidekiq with ActiveJob, add to `environments/your-env-file.rb`, for me is `development.rb` and `production.rb`

> https://github.com/mperham/sidekiq/wiki/Active-Job

```ruby
config.active_job.queue_adapter = :sidekiq
```

Sidekiq UI authenticate with devise and cancancan

> https://github.com/mperham/sidekiq/wiki/Monitoring#devise

```ruby
# sidekiq
require 'sidekiq/web'
authenticate :user, ->(u) { Ability.new(u).can?(:manage, :admin) } do
  mount Sidekiq::Web => 'admin/sidekiq'
end
```
and go to /admin/sidekiq see the sidekiq dashboard

config sidekiq `config/sidekiq.yml`
> https://github.com/mperham/sidekiq/wiki/Advanced-Options

```yml
:concurrency: 10
:queues:
  - ['default', 1]
  - ["mailers", 1]
```

**concurrency need to <= `config/database.yml`'s pool setting**

if config/database.yml pool: 10
then config/sidekiq.yml concurrency: 10

> heroku postgres free plan can only provide 20 connection max so set pool < 20

run a worker
```bash
$ sidekiq -C config/sidekiq.yml
```

or see https://github.com/mperham/sidekiq/wiki/Advanced-Options#queues

ActiveJob queue name default is `default`
ActionMailer queue name default is `mailers`

## Heroku

setup a Procfile

```
# Procfile
web: bundle exec puma -C config/puma.rb
sidekid: bundle exec sidekiq -C config/sidekiq.yml
```

use web dyno and sidekid worker

```bash
$ heroku ps:scale web=1
$ heroku ps:scale sidekid=1
```

部署指令
deploy to heroku

```bash
$ git push heroku master
$ heroku run rake db:migrate
```

set Heroku env value

```bash
# by heroku cli
heroku config:set key=value
# by figaro
$ figaro heroku:set -e production
# by heruku web dashboard Setting > Reveal Config Vars
```

查看heroku環境變數

```bash
$ heroku config
```

備份 db 到本地的 local_db_name

```bash
$ heroku pg:pull DATABASE_URL localDbName --app caten-church
```

Logger
```bash
$ heroku logs --tail
```

### heroku app 加上 newrelic

參考 https://docs.newrelic.com/docs/agents/ruby-agent/installation/install-new-relic-ruby-agent#Installing_the_Gem

### sendgrid
在 config/environments/production.rb 設定  
用 smtp 連結 sendgrid 寄信  

```ruby
# heroku sendgrid mailer
config.action_mailer.delivery_method = :smtp
config.action_mailer.perform_deliveries = true
config.action_mailer.raise_delivery_errors = true
config.action_mailer.default_url_options = { host: 'caten-church.com' }
config.action_mailer.smtp_settings = {
  :user_name => ENV['SENDGRID_USERNAME'],
  :password => ENV['SENDGRID_PASSWORD'],
  :domain => 'heroku.com',
  :address => 'smtp.sendgrid.net',
  :port => 587,
  :authentication => :plain,
  :enable_starttls_auto => true
}
```

到 config/application.yml 加上
```ruby
production:
  MAIL_USERNAME: "MAIL_USERNAME"
  SENDGRID_USERNAME: "SENDGRID_USERNAME"
  SENDGRID_PASSWORD: "SENDGRID_PASSWORD"
  SENDGRID_API_KEY: "SENDGRID_API_KEY"
```

> 也可以不用 sendgrid 的 smtp 改用 api 寄信參考  
> https://devcenter.heroku.com/articles/sendgrid#ruby
> https://github.com/sendgrid/sendgrid-ruby


### Heroku and sidekiq and redistogo

see https://www.youtube.com/watch?v=GBEDvF1_8B8&t=774s

## Linux

### 檢查port被哪個行程佔用

例如 port 3000

```bash
# 列出 port 3000 的行程
$ lsof -i:3000
# 列出 port 3000 行程的 pid
$ lsof -t -i:3000
# 透過 pid 清除行程
$ kill $(lsof -t -i:3000)
# or 使用 -9 option
$ kill -9 $(lsof -t -i:3000)
```
