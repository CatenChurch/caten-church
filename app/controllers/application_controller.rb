class ApplicationController < ActionController::Base
  check_authorization # 檢查所有controller的cancancan驗證
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception

  # Rails 101 中學到的
  # http://courses.growthschool.com/courses/rails-101/lectures/229607
  # 還看不太懂
  before_filter :configure_permitted_parameters, if: :devise_controller?

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :email, :password, :password_confirmation])
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :email, :password, :password_confirmation, :current_password])
  end
end
