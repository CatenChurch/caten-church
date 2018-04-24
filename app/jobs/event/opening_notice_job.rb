class Event::OpeningNoticeJob < ApplicationJob
  queue_as :default

  def perform(days)
    @events = Event.start_after_days(days).includes(participants: [:profile, :subscription])
    @events.each(&:opening_notice)
  end
end
