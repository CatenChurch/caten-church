class Chatbot::LinesController < Chatbot::BaseController
  require 'line/bot'
  before_action :setup_line_bot

  def callback
    # line will post something like this
    # {
    #   "events": [
    #     {
    #       "type": "message",
    #       "replyToken": "16456834b271405a896a13c4692cf8e3",
    #       "source": {
    #         "userId": "Ub38d4062c864a494a3229bc077a6551d",
    #         "type": "user"
    #       },
    #       "timestamp": 1509884468226,
    #       "message": {
    #         "type": "text",
    #         "id": "6945380161618",
    #         "text": "hi"
    #       }
    #     }
    #   ],
    #   "line": {
    #     "events": [
    #       {
    #         "type": "message",
    #         "replyToken": "16456834b271405a896a13c4692cf8e3",
    #         "source": {
    #           "userId": "Ub38d4062c864a494a3229bc077a6551d",
    #           "type": "user"
    #         },
    #         "timestamp": 1509884468226,
    #         "message": {
    #           "type": "text",
    #           "id": "6945380161618",
    #           "text": "hi"
    #         }
    #       }
    #     ]
    #   }
    # }
    data = request.raw_post
    signature = request.env['HTTP_X_LINE_SIGNATURE']
    if @bot.validate_signature(data, signature)
      conversations = @bot.parse_events_from(data)
      conversations.each do |conversation|
        next unless conversation.is_a?(Line::Bot::Event::Message) && conversation.type == 'text'
        message = { type: 'text', text: conversation.message['text'] }
        @bot.reply_message(conversation['replyToken'], message)
      end
      render plain: 'success', status: 200
    else
      render plain: 'valid signature failed', status: 400
    end
  end

  private

  def setup_line_bot
    @bot = Line::Bot::Client.new do |config|
      config.channel_secret = ENV['LINE_CHANNEL_SECRET']
      config.channel_token = ENV['LINE_CHANNEL_TOKEN']
    end
  end
end
