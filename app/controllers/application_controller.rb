class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  protect_from_forgery with: :exception

  include DeviseRedirectable

  before_action :configure_permitted_parameters, if: :devise_controller?

  # cancancan 拒絕後導向
  rescue_from CanCan::AccessDenied do |_exception|
    redirect_to new_user_session_path, alert: '請先登入'
  end

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: %i[email password password_confirmation current_password])
  end
end
