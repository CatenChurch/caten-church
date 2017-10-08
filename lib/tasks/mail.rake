namespace :mail do
  namespace :admin do
    desc '寄送下月壽星列表給 admin'
    task birth_notification: :environment do
      Rails.logger.info "Task start: send birth_notification to admin"
      month = (Time.now + 1.months).month
      UserMailer.send_birth_notification_to_admin(month)
      Rails.logger.info "Task end"
    end
  end
end
