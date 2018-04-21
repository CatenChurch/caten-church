class Account::SubscriptionsController < Account::BaseController
  before_action :find_subscription

  def show; end

  def edit; end

  def update
    if @subscription.update(subscription_params)
      flash[:notice] = t('.success')
      redirect_to account_subscription_url
    else
      flash[:alert] = t('.failed')
      render :edit
    end
  end

  private

  def find_subscription
    @subscription = current_user.subscription
  end

  def subscription_params
    params.require(:subscription).permit(:new_events, :joined_events)
  end
end
