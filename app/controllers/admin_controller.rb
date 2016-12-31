class AdminController < ApplicationController
  layout 'admin'
  # 權限管理交給cancancan
  # before_action :authenticate_admin!
  authorize_resource :admin

  # cancancan拒絕後導向
  rescue_from CanCan::AccessDenied do |exception|
    redirect_to root_path, alert: "你不是管理員"
  end
  
  private
  def authenticate_admin!
    user = current_user || User.new
  	if !user.is_manager?
  		flash[:danger] = "你不是管理員"
  		redirect_to root_path 
  	end
  end
end
