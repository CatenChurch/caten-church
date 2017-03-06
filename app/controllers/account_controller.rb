class AccountController < ApplicationController
  authorize_resource :account

  # cancancan拒絕後導向
  rescue_from CanCan::AccessDenied do |exception|
    redirect_to root_path, alert: "你不是會員"
  end
end
