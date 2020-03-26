# frozen_string_literal: true

class Admin::SendBirthNotificationToAdminJob < ApplicationJob
  queue_as :default

  def perform
    month = (Time.now + 1.months).month
    User.with_role(:admin).each do |admin|
      UserMailer.birth_notification(admin, month).deliver_now
    end
  end
end
