# frozen_string_literal: true

class ApplicationMailer < ActionMailer::Base
  default from: ENV['MAILER_SENDER'] ||
                Rails.application.credentials.dig(Rails.env.to_sym, :mail, :username) ||
                '茄典教會 <notify@caten-church.org>'
  layout 'mailer'
end
