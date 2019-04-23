# caten church

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

Fill in database connection in `config/database.yml`, then create database

```sh
$ rails db:setup
```

Copy example credentials from `config/credentials.yml.example`, then fill in your credentials

```sh
$ EDITOR="atom --wait" rails credentials:edit
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

## Deploy

 - make sure `ENV["RAILS_MASTER_KEY"]` or `config/master.key` exists
 - make sure `ENV["DATABASE_URL"]` or `Rails.application.credentials[:production][:database_url]` exists