class Admin::BaseController < ApplicationController
  layout 'admin'

  # 權限管理交給cancancan
  authorize_resource class: :admin

  # cancancan拒絕後導向
  rescue_from CanCan::AccessDenied do |exception|
    redirect_to root_url, alert: t('cancancan.not_admin')
  end
end
