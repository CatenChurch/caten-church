# frozen_string_literal: true

class Users::ConfirmationsController < Devise::ConfirmationsController
  include DeviseRedirectable

  def cancel
    if current_user.update(unconfirmed_email: nil, confirmation_token: nil)
      flash[:notice] = '已取消申請更改 Email'
    else
      flash[:alert] = '無法取消申請更改 Email，流程中出了些錯誤'
    end
    redirect_to edit_user_registration_path
  end

  protected

  def after_confirmation_path_for(_resource_name, resource)
    sign_in resource, event: :authentication
    after_sign_in_path_for(resource)
  end
end
