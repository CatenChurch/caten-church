class Chatbot::MessengersController < Chatbot::BaseController
  def verify
    if params['hub.mode'] == 'subscribe' && params['hub.verify_token'] == ENV['FB_MESG_TOKEN']
      render plain: params['hub.challenge'], status: :ok
    else
      render plain: 'mode is not subscribe or verify_token wrong', status: :unprocessable_entity
    end
  end

  def callback
  end
end
