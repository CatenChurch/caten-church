class LineBot::Service
  require 'line/bot'
  
  attr_reader :bot, :chats

  def initialize(request)
    @body = request.raw_post
    @signature = request.env['HTTP_X_LINE_SIGNATURE']
    @bot = Line::Bot::Client.new do |config|
      config.channel_secret = ENV['LINE_CHANNEL_SECRET']
      config.channel_token = ENV['LINE_CHANNEL_TOKEN']
    end
    @chats = @bot.parse_events_from(@body)
    @reply_messages = []
  end

  def reply
    valid_signature
    @chats.each do |chat|
      token = conversation['replyToken']
      message = bulid_reply_message(chat)
      next if message.blank?

      @bot.reply_message token, message
    end
  end

  def self.caten_help
    actions = []
    actions << LineBot::Formats::Actions::Message.new('caten 目前的活動', 'caten 目前的活動')
    actions << LineBot::Formats::Actions::Message.new('caten 過期的活動', 'caten 過期的活動')
    template = LineBot::Formats::Templates::Buttons.new('你想問我什麼?', actions, title: '幫助選單')
    LineBot::Formats::Messages::Template.new('幫助選單,你想問我什麼?', template).to_h
  end

  private

  def valid_signature
    raise 'signature invalid' unless @bot.validate_signature(@body, @signature)
  end

  # write your reply logic here
  def bulid_reply_message(chat)
    return '' unless chat.is_a?(Line::Bot::Event::Message)
    return '' unless chat.type == 'text'
    return '' unless chat.message['text'][0..4].casecmp('caten').zero?
    text = chat.message['text']

    case text.split[1]
    when 'help'
      LineBot::Service.caten_help
    else
      LineBot::Formats::Messages::Text(text).to_h
    end
  end
end
