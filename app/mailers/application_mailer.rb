class ApplicationMailer < ActionMailer::Base
  default from: ENV['MAIL_USERNAME']
  layout 'mailer'
end
