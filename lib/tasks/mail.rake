namespace :mail do
  namespace :admin do
    desc '寄送下月壽星列表給管理員'
    task birth_notification: :environment do
      Rails.logger.info 'Job Admin::SendBirthNotificationToAdminJob.perform_now Start'
      Admin::SendBirthNotificationToAdminJob.perform_now
      Rails.logger.info 'Job Admin::SendBirthNotificationToAdminJob.perform_now End'
    end

    desc '寄送下月壽星列表給管理員（背景執行）'
    task birth_notification_later: :environment do
      Rails.logger.info 'Job Admin::SendBirthNotificationToAdminJob.perform_later Start'
      Admin::SendBirthNotificationToAdminJob.perform_later
      Rails.logger.info 'Job Admin::SendBirthNotificationToAdminJob.perform_later End'
    end
  end

  namespace :event do
    desc '於活動開始前一天提醒報名活動者'
    task opening_notice_before_1: :environment do
      Rails.logger.info 'Job Event::OpeningNoticeJob.perform_now(1) Start'
      Event::OpeningNoticeJob.perform_now(1)
      Rails.logger.info 'Job Event::OpeningNoticeJob.perform_now(1) End'
    end
  end
end
