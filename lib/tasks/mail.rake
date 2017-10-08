namespace :mail do
  namespace :admin do
    desc '寄送下月壽星列表給 admin'
    task birth_notification: :environment do
      Rails.logger.info "Task start: send birth_notification to admin"
      month = (Time.now + 1.months).month
      Rails.logger.info "birth month is #{month}"
      User.with_role(:admin).each do |recipient|
        UserMailer.birth_notification(recipient, month).deliver_later
        Rails.logger.info "mail to #{recipient.email}"
      end
      Rails.logger.info "Task end"
    end
  end
end
