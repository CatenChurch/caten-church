class Account::MessengersController < ApplicationController
  before_action :find_messenger
  def update
    if @messenger.update(messenger_params)
      flash[:notice] = t('.success', provider: @messenger.provider, activated: Messenger.human_attribute_name("activated.#{@messenger.activated}"))
    else
      flash[:alert] = t('.failed')
    end
    redirect_to account_subscription_url
  end

  private

  def find_messenger
    @messenger = current_user.messengers.find(params[:id])
  end

  def messenger_params
    params.require(:messenger).permit(:activated)
  end
end
