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
