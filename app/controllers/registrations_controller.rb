class RegistrationsController < Devise::RegistrationsController

  protected
  def after_sign_up_path_for(resource)
    account_profile_new_path
  end
end
