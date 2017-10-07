class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  include DeviseRedirectable

  # Rails 101 中學到的還看不太懂
  # http://courses.growthschool.com/courses/rails-101/lectures/229607
  before_action :configure_permitted_parameters, if: :devise_controller?

  # cancancan拒絕後導向
  rescue_from CanCan::AccessDenied do |exception|
    redirect_to new_user_session_path, alert: t('cancancan.login_first')
  end

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:email, :password, :password_confirmation, :current_password])
  end
end
