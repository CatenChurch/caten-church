# Scheduled Task 定時任務

`ActiveJob` + `Rake Task` + `Corntab` 這種架構適合:

- 穩定
- 分鐘級別以上

寫個 ActiveJob 用 Rake task 包起來成為一個可以在bash上調用的命令

## Heroku Scheduler

Heroku 上並沒有提供 `Corntab`，在 Heroku 上做排程任務

要使用 Heroku Scheduler 這個 add-on

到 Heroku App dashboard 新增 Heroku Scheduler，add new job 把指令打上

```bash
# every months 25th do this rake task
if [ "$(date +%d)" = 25 ]; then rails mail:admin:birth_notification; fi
```

> 這裡可以參考這篇文章 https://blog.dbrgn.ch/2013/10/4/heroku-schedule-weekly-monthly-tasks/


Heroku Scheduler 只提供間距為 10 分鐘級別的定時任務，若要更精細，只能使用應用層級的定時排程了例如:
- https://github.com/mperham/sidekiq/wiki/Scheduled-Jobs
- https://github.com/moove-it/sidekiq-scheduler
- https://github.com/ondrejbartas/sidekiq-cron
