class Account::BaseController < ApplicationController
  # 權限管理交給cancancan
  authorize_resource class: :account
end
