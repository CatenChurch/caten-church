class Account::MessengersController < ApplicationController
  before_action :find_messenger
  def update
    if @messenger.update(messenger_params)
      flash[:notice] =
        "更新通知管道成功，#{@messenger.provider}: #{Messenger.human_attribute_name('activated.' + @messenger.activated.to_s)}"
    else
      flash[:alert] = '更新通知管道失敗'
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
