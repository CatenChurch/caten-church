# CatenChurch

本專案為茄典教會網站，網址是 <https://caten-church.com/>

專案的架構為 `Rails` + `Puma` + `Postgres` + `Sidekiq` + `Redis` 架設在 `Heroku`，監控使用 `Newrelic`

## Requirements

- Ruby
- Rails
- Nodejs
- Yarn
- Postgresql (`brew install postgresql`)
- Redis (`brew install redis`)

## Setup

```sh
$ git clone https://github.com/CatenChurch/caten-church.git
$ cd caten-church
$ bundle install
```

fill in database connection

```yml
# config/database.yml
development:
  <<: *default
  database: 'your-database-name'
  username: 'your-user-name'
  password: 'your-user-password'
```

setup env

```
$ mv config/application.yml.example config/application.yml
```

fill in your values in `config/application.yml`

```yml
# config/application.yml
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

```sh
$ rails db:setup
```

## Usage

migrate database

```sh
$ rails db:migrate
```

run server

```sh
# rails way
$ rails s

# via puma
$ puma -C config/puma.rb
```

run worker

```sh
$ sidekiq -C config/sidekiq.yml
```

rake tasks

```sh
# 寄送下月壽星列表給管理員
$ rails mail:admin:birth_notification

# 於活動開始前一天提醒報名活動者
$ rails mail:event:opening_notice_before_1

# generate public/sitmap.xml
$ rake sitemap:refresh
```
