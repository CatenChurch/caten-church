class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception


  # Rails 101 中學到的
  # http://courses.growthschool.com/courses/rails-101/lectures/229607
  # 還看不太懂
  before_filter :configure_permitted_parameters, if: :devise_controller?

  def guest_user
    if current_user.blank?
      current_user = User.new
    end
  end
  protected

  def configure_permitted_parameters
    # old devise
  	# devise_parameter_sanitizer.for(:sign_up) { |u| u.permit(:name, :email, :password, :password_confirmation) }
  	# devise_parameter_sanitizer.for(:account_update) { |u| u.permit(:name, :email, :password, :password_confirmation, :current_password) }
    
    # new devise
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :email, :password, :password_confirmation])
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :email, :password, :password_confirmation, :current_password])
  end
end
