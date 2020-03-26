# frozen_string_literal: true

class Admin::BaseController < ApplicationController
  layout 'admin'

  # 權限管理交給 cancancan
  authorize_resource class: :admin

  # cancancan 拒絕後導向
  rescue_from CanCan::AccessDenied do |_exception|
    redirect_to root_url, alert: '需要管理員權限'
  end
end
