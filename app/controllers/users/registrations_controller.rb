class Users::RegistrationsController < Devise::RegistrationsController

  protected
  def after_sign_in_path_for(resource)
    if resource.is_a?(User) && resource.first_time_sign_in?
      new_account_profile_path
    else
      super
    end
  end
end
