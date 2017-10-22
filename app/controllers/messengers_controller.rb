class MessengersController < ApplicationController
  def webhook
    if params['hub.mode'] == 'subscribe' && params['hub.verify_token'] == ENV['FB_MESG_TOKEN']
      render plain: params['hub.challenge'], status: 200
    end
  end
end
