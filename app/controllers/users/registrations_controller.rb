class Users::RegistrationsController < Devise::RegistrationsController
  include DeviseRedirectable

  # override before_action
  # https://github.com/plataformatec/devise/blob/master/app/controllers/devise/registrations_controller.rb
  before_action :require_no_authentication, only: [:new, :create, :cancel, :oauth_create]
  before_action :set_minimum_password_length, only: [:new, :edit, :oauth_new]

  before_action :find_provider, only: [:oauth_new, :oauth_create]

  # about session[:oauth] see Users::OmniauthCallbacksController
  # session[:oauth_id]
  # session[:oauth_email]
  # session[:oauth_provider]

  def oauth_new
    @user = User.new email: session[:oauth_email]
  end

  def oauth_create
    @oauth = Oauth.find session[:oauth_id]
    @user = User.new sign_up_params
    @user.skip_confirmation! if sign_up_params[:email] == session[:oauth_email]

    if @user.save
      @oauth.connect @user

      # delete session
      session.delete :oauth_id
      session.delete :oauth_email
      session.delete :oauth_provider

      flash[:success] = '以 Facebook 帳號註冊成功'
      sign_in_and_redirect @user, event: :authentication
    else
      render :oauth_new
    end
  end

  private

  def find_provider
    @provider = session[:oauth_provider]
  end
end
