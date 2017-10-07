class Users::ConfirmationsController < Devise::ConfirmationsController
  include DeviseRedirectable

  def cancel
    if current_user.update(unconfirmed_email: nil, confirmation_token: nil)
      flash[:notice] = t('devise.confirmations.canceled')
    else
      flash[:warning] = t('devise.confirmations.cancel_failed')
    end
    redirect_to edit_user_registration_path
  end

  protected

  def after_confirmation_path_for(resource_name, resource)
    sign_in resource, :event => :authentication
    after_sign_in_path_for(resource)
  end
end
