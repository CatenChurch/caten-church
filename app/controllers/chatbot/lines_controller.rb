class Chatbot::LinesController < Chatbot::BaseController
  require 'line/bot'
  before_action :setup_line_bot

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
  def callback
    data = request.raw_post
    signature = request.env['HTTP_X_LINE_SIGNATURE']
    if @bot.validate_signature(data, signature)
      conversations = @bot.parse_events_from(data)
      conversations.each do |conversation|
        next unless conversation.is_a?(Line::Bot::Event::Message) &&
                    conversation.type == 'text' &&
                    conversation.message['text'][0..4].casecmp('caten').zero?
        message = if conversation.message['text'][6..9] == 'help'
                    {
                      type: 'template',
                      altText: '幫助選單,請選擇以下你想詢問的問題',
                      template: {
                        type: 'buttons',
                        title: '幫助選單',
                        text: '請選擇以下你想詢問的問題',
                        actions: [
                          {
                            type: 'postback',
                            label: 'caten 目前的活動',
                            data: 'events=now'
                          },
                          {
                            type: 'postback',
                            label: 'caten 過期的活動',
                            data: 'events=expire'
                          }
                        ]
                      }
                    }
                  else
                    # echo
                    { type: 'text', text: (conversation.message['text'][5..-1] || '').lstrip }
                  end
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
