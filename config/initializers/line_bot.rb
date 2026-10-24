# frozen_string_literal: true

require 'line/bot'
require 'line/bot/message_builder'

# set channel secret and token
Rails.application.config.line_bot = {
  channel_secret: ENV['LINE_CHANNEL_SECRET'] || Rails.application.credentials.dig(:line, :channel_secret),
  channel_token: ENV['LINE_CHANNEL_TOKEN'] || Rails.application.credentials.dig(:line, :channel_token)
}
