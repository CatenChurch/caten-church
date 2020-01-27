class EventMailer < ApplicationMailer
  default from: '茄典教會 <notify@caten-church.org>'

  def opening_notice(event, recipient)
    @event = event
    @recipient = recipient

    mail to: @recipient.email, subject: "茄典教會活動提醒 : #{@event.name}"
  end
end
