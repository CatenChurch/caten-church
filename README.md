# CatenChurch

## 部署至Heroku

```
$ git push heroku master
$ heroku run rake db:migrate
$ figaro heroku:set -e production
```
