class Chatbot::LinesController < Chatbot::BaseController
  def callback
    if params['hub.mode'] == 'subscribe' && params['hub.verify_token'] == ENV['FB_MESG_TOKEN']
      render plain: params['hub.challenge'], status: 200
    else
      render plain: 'wrong verify token', status: 404
    end
  end
end
