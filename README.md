# CatenChurch

## 部署至Heroku

```bash
$ git push heroku master
$ heroku run rake db:migrate
$ figaro heroku:set -e production
# 查看heroku環境變數
$ heroku config
# 備份db到local pg 的 localDbName資料庫
$ heroku pg:pull DATABASE_URL localDbName --app caten-church
```
### heroku app 加上 newrelic
參考
https://docs.newrelic.com/docs/agents/ruby-agent/installation/install-new-relic-ruby-agent#Installing_the_Gem

## Reset counter cache
如果counter cache出錯了，則進入rails console用此方法重整  

```bash
# 例如想重整 event.id = 15 的 participants_count
Event.reset_counters 15, :participants
```

## 檢查port被哪個行程佔用
例如 port 3000

```bash
# 列出 port 3000 的行程
$lsof -i:3000
# 列出 port 3000 行程的 pid
$lsof -t -i:3000
# 透過 pid 清除行程
$kill $(lsof -t -i:3000)
# or 使用 -9 option
$kill -9 $(lsof -t -i:3000)
```

## model schema
```bash
$ annotate --exclude tests,fixtures,factories,serializers
```

## sitemap
add below line in Gemfile

```ruby
gem 'sitemap_generator'
```

usage

```bash
# init config/sitemap.rb
rake sitemap:install
# generate public/sitmap.xml.gz
rake sitemap:refresh
```

add sitemap in public/robots.txt

```
sitemap: caten-church.herokuapp.com/sitemap.xml.gz
```
