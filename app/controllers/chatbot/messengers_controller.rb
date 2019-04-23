# frozen_string_literal: true

class Chatbot::MessengersController < Chatbot::BaseController
  def verify
    if params['hub.mode'] == 'subscribe' &&
       params['hub.verify_token'] == Rails.application.credentials[:facebook][:message_token]
      render plain: params['hub.challenge'], status: :ok
    else
      render plain: 'mode is not subscribe or verify_token wrong', status: :unprocessable_entity
    end
  end

  def callback
    bot = FacebookMessengerService.new(entry_params)
    bot.perform
    render plain: 'success', status: :ok
  end

  private

  # return hash like:
  # {"entry"=>
  # [{"messaging"=>
  #    [{"recipient"=>{"id"=>"293071247275013"},
  #      "sender"=>{"id"=>"1492026264214527"},
  #      "optin"=>
  #       {"ref"=>"user_id=1::auth_token=XdcZyemxcCyh4sAQfMYJ69kW::action=activate_messenger"}}]}]}
  def entry_params
    params.permit(entry: [messaging: [recipient: :id, sender: :id, optin: :ref]])
  end
end
