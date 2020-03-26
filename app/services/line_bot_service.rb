# frozen_string_literal: true

class LineBotService
  include Line::Bot::MessageBuilder
  attr_reader :bot, :chats

  def initialize(request)
    @request = request
    @body = @request.raw_post
    @signature = @request.env['HTTP_X_LINE_SIGNATURE']
    @bot = Line::Bot::Client.new(Rails.application.config.line_bot)
    @chats = @bot.parse_events_from(@body)
    raise 'signature invalid' unless @bot.validate_signature(@body, @signature)
  end

  def perform
    @chats.each do |chat|
      token = chat['replyToken']
      message = bulid_msg_and_react(chat).to_h
      next if message.blank?

      @bot.reply_message token, message
    end
  end

  private

  def bulid_msg_and_react(chat)
    # write your reply logic here
    case chat
    when Line::Bot::Event::Message
      text = chat['message'].fetch('text') { '' }
      return help if text.match?(/^caten help/)

      echo
    end
  end

  def help
    Message::Template.new do |t|
      t.alt_text = '幫助選單,你想問我什麼?'
      t.template = Template::Buttons.new do |b|
        b.text = '你想問我什麼?'
        b.actions << Action::Message.new do |m|
          m.label = 'caten 目前的活動'
          m.text = 'caten 目前的活動'
        end
        b.actions << Action::Message.new do |m|
          m.label = 'caten 過期的活動'
          m.text = 'caten 過期的活動'
        end
      end
    end
  end

  def echo(text)
    Message::Text.new(text: "學你說話 #{text}")
  end
end
