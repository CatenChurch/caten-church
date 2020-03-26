# frozen_string_literal: true

# Preview all emails at http://localhost:3000/rails/mailers/user
class UserPreview < ActionMailer::Preview
  # Preview this email at http://localhost:3000/rails/mailers/user/birth_notification
  def birth_notification
    UserMailer.birth_notification(User.first, 10)
  end
end
