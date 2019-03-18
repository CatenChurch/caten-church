module DeviseRedirectable

  protected

  def after_sign_in_path_for(user)
    return new_user_confirmation_path unless user.confirmed?
    return new_account_profile_path if user.first_time_sign_in?
    return new_account_profile_path unless user.profile&.valid?

    super
  end
end
