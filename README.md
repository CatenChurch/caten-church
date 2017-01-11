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
