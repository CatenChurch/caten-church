class Account::BaseController < ApplicationController
  # 權限管理交給 cancancan
  authorize_resource class: :account
end
