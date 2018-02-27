class UserMailer < ApplicationMailer
  def birth_notification(recipient, month)
    @recipient = recipient
    @month = month

    @users = User.birth_month(month).includes(:profile)
    @days = Array.new(31) { Array.new }
    @users.each { |user| @days[user.profile.birth.day] << user }

    mail to: @recipient.email, subject: default_i18n_subject(month: @month)
  end
end
