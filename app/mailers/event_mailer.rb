class EventMailer < ApplicationMailer

  # Subject can be set in your I18n file at config/locales/en.yml
  # with the following lookup:
  #
  #   en.event_mailer.opening_countdown_notice.subject
  #
  def opening_countdown_notice(recipient, event)
    @recipient = recipient
    @event = event
    mail to: @recipient.email, subject: default_i18n_subject(name: @event.name)
  end
end
