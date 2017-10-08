class UserMailer < ApplicationMailer
  def birth_notification(recipient, month)
    @month = month
    @users = User.includes(:profile).birth_month month
    @days = Array.new(31) { Array.new }
    @users.each do |user|
      @days[user.profile.birth.day] << user
    end
    mail to: recipient.email, subject: "茄典教會#{@month}月份壽星通知"
  end
end
