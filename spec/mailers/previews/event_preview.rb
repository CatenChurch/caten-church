# Preview all emails at http://localhost:3000/rails/mailers/event
class EventPreview < ActionMailer::Preview

  # Preview this email at http://localhost:3000/rails/mailers/event/opening_notice
  def opening_notice
    EventMailer.opening_notice(Event.last, User.last)
  end

end
