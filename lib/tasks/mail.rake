namespace :mail do
  namespace :admin do
    desc '寄送下月壽星列表給 admin'
    task birth_notification: :environment do
      Rails.logger.info "Task start: send birth_notification to admin now"
      Admin::SendBirthNotificationToAdminJob.perform_now
      Rails.logger.info "Task end"
    end

    desc '用 background job 寄送下月壽星列表給 admin'
    task birth_notification_later: :environment do
      Rails.logger.info "Task start: send birth_notification to admin later"
      Admin::SendBirthNotificationToAdminJob.perform_later
      Rails.logger.info "Task end"
    end
  end
end
