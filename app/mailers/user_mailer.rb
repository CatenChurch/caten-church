# frozen_string_literal: true

class UserMailer < ApplicationMailer
  default from: '茄典教會 <notify@caten-church.org>'

  def birth_notification(recipient, month)
    @recipient = recipient
    @month = month
    @users = User.birth_month(month).includes(:profile)
    @days = Array.new(31) { [] }
    @users.each { |user| @days[user.profile.birth.day] << user }
    mail to: @recipient.email, subject: "茄典教會會員 #{@month} 月份壽星通知"
  end
end
