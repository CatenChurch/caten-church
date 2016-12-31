class AdminController < ApplicationController
  layout 'admin'
  # 權限管理交給cancancan
  # before_action :authenticate_admin!
  authorize_resource :admin
  
  private
  def authenticate_admin!
    user = current_user || User.new
  	if !user.is_manager?
  		flash[:danger] = "你不是管理員"
  		redirect_to root_path 
  	end
  end
end
