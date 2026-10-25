# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: Rails.application.config.x.mailer_sender
  layout 'mailer'
end
