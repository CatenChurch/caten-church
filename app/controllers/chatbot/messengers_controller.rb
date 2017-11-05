class Chatbot::MessengersController < Chatbot::BaseController
  def verification
    if params['hub.mode'] == 'subscribe' && params['hub.verify_token'] == ENV['FB_MESG_TOKEN']
      render plain: params['hub.challenge'], status: 200
    else
      render plain: 'wrong verify token', status: 404
    end
  end

  def webhook
    logger.info params
  end
end
