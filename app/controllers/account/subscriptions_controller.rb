# frozen_string_literal: true

class Account::SubscriptionsController < Account::BaseController
  before_action :find_subscription
  before_action :check_user_auth_token, only: [:show]

  def show; end

  def edit; end

  def update
    if @subscription.update(subscription_params)
      flash[:notice] = '更新消息訂閱成功'
      redirect_to account_subscription_url
    else
      flash[:alert] = '更新消息訂閱失敗'
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

  def check_user_auth_token
    if current_user.auth_token.blank? || (current_user.auth_token_sent_at + 30.minutes < Time.now)
      current_user.regenerate_auth_token
    end
  end
end
