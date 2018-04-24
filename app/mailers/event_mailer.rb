class EventMailer < ApplicationMailer
  # Subject can be set in your I18n file at config/locales/en.yml
  # with the following lookup:
  #
  #   en.event_mailer.opening_notice.subject
  #
  def opening_notice(event, recipient)
    @event = event
    @recipient = recipient

    mail to: @recipient.email, subject: default_i18n_subject(event: @event.name)
  end
end
