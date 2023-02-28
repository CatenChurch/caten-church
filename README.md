# Caten Church

本專案為茄典教會網站，網址是 <https://caten-church.org/>

## Requirements

- Ruby
- Rails
- NodeJS
- Yarn
- PostgresSQL
- Redis

## Setup

```sh
git clone https://github.com/CatenChurch/caten-church.git
cd caten-church
bundle install
```

Create database user `caten_church` with password `caten_church` and create db `caten_church` or Fill in your database connection in `config/database.yml`

```sh
createuser caten_church --interactive -P
createdb caten_church -U caten_church
```

Then create database

```sh
rails db:setup
```

Copy example credentials from `config/credentials.yml.example`, then fill in your credentials

```sh
EDITOR="code --wait" rails credentials:edit
```

Using [mkcert](https://github.com/FiloSottile/mkcert) (brew install mkcert) self-signed certificate ssl

```sh
$ mkcert localhost

Using the local CA at "/Users/username/Library/Application Support/mkcert" ✨

Created a new certificate valid for the following names 📜
 - "localhost"

The certificate is at "./localhost.pem" and the key at "./localhost-key.pem" ✅
```

mkcert generated cert `localhost.pem` and key `localhost-key.pem`, moving these to `config/ssl/`

```sh
mv ./localhost.pem ./localhost-key.pem ./config/ssl/
```

puma and webpack-dev-server will load these .pem files, then force http connection on <https://localhost:3000> and <https://localhost:3035>

## Usage

migrate database

```sh
rails db:migrate
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
sidekiq -C config/sidekiq.yml
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

This application currently deploy on Heroku, and using Google Cloud Storage to store uploaded files, if you want to store file locally in development environment, go to `config/environments/development.rb` and let `config.active_storage.service = :local`

## Heroku

Dumping database to local

```sh
heroku pg:pull DATABASE_URL postgres://$USERNAME:$PASSWORD@$HOST:$PORT/$DB_NAME --app $APP_NAME
```