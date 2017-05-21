# CatenChurch

## 部署至Heroku

```
$ git push heroku master
$ heroku run rake db:migrate
$ figaro heroku:set -e production
# 查看heroku環境變數
$ heroku config
# model schema
$ annotate --exclude tests,fixtures,factories,serializers
```
## Reset counter cache
如果counter cache出錯了，則進入rails console用此方法重整  

```
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
