# Preview all emails at http://localhost:3000/rails/mailers/event
class EventPreview < ActionMailer::Preview

  # Preview this email at http://localhost:3000/rails/mailers/event/opening_countdown_notice
  def opening_countdown_notice
    EventMailer.opening_countdown_notice(User.last, Event.last)
  end

end
