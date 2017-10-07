module DeviseRedirectable

  protected

  def after_sign_in_path_for(resource)
    if !resource.confirmed?
      new_user_confirmation_path
    elsif resource.first_time_sign_in?
      new_account_profile_path
    elsif !resource.has_valid_profile?
      new_account_profile_path
    else
      super
    end
  end
end
