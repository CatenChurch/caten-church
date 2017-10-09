class UserMailer < ApplicationMailer
  def birth_notification(recipient, month)
    @recipient = recipient
    @month = month

    @users = User.includes(:profile).birth_month month
    @days = Array.new(31) { Array.new }
    @users.each { |user| @days[user.profile.birth.day] << user }

    mail to: @recipient.email, subject: "茄典教會#{@month}月份壽星通知"
  end
end
