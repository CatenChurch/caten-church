class UserMailer < ApplicationMailer
  def self.send_birth_notification_to_admin(month)
    users = User.includes(:profile).birth_month month
    days = Array.new(31) { Array.new }
    users.each { |user| days[user.profile.birth.day] << user }
    User.with_role(:admin).each do |admin|
      birth_notification(admin, users, month, days).deliver
    end
  end

  def birth_notification(recipient, users, month, days)
    @recipient = recipient
    @users = users
    @month = month
    @days = days
    mail to: recipient.email, subject: "茄典教會#{@month}月份壽星通知"
  end
end
