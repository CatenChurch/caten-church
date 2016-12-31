class AdminController < ApplicationController
  layout 'admin'
  before_action :authenticate_admin!
  private
  def authenticate_admin!
    current_user||=User.new
  	if !current_user.is_manager?
  		flash[:danger] = "你不是管理員"
  		redirect_to root_path 
  	end
  end
end
