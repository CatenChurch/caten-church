class Chatbot::LinesController < Chatbot::BaseController
  def callback
    bot = LineBotService.new(request)
    bot.perform
    render plain: 'success', status: :ok
  end
end
