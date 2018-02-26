class Event::SendOneDayNotificationJob < ApplicationJob
  queue_as :default

  def perform
    @events = Event.where('start >= :tomorrow', tomorrow: Date.tomorrow)
                   .where('start < :after_tomorrow', after_tomorrow: (Date.tomorrow + 1.days))
                   .includes(participants: :profile)
    @events.each do |event|
      users = event.participants
      users.each do |user|
        EventMailer.opening_countdown_notice(user, event).deliver_now
      end
    end
  end
end
