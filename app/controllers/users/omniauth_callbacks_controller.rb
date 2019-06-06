class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def facebook
    # data stored in request.env["omniauth.auth"]
    # see https://github.com/mkdynamic/omniauth-facebook#auth-hash
    oauth_data = request.env['omniauth.auth']
    provider = oauth_data.dig :provider
    uid = oauth_data.dig :uid
    email = oauth_data.dig :info, :email
    token = oauth_data.dig :credentials, :token

    # first or initialize oauth
    @oauth = Oauth.where(provider: provider, uid: uid).first_or_create do |oauth|
      oauth.provider = provider
      oauth.uid = uid
    end
    @oauth.refresh(token)

    # Sign up
    if !user_signed_in? && !@oauth.connected?
      session[:oauth_id] = @oauth.id
      session[:oauth_email] = email
      session[:oauth_provider] = provider
      flash[:notice] = '以 Facebook 帳號進行註冊'
      redirect_to new_oauth_user_registration_url

    # Sign in
    elsif !user_signed_in? && @oauth.connected?
      flash[:notice] = '以 Facebook 帳號授權登入'
      sign_in_and_redirect @oauth.user, event: :authentication # this will throw if @user is not activated

    # Connect
    elsif user_signed_in? && !@oauth.connected?
      @oauth.connect current_user
      flash[:notice] = '帳號與 Facebook 帳號連結成功'
      redirect_to edit_user_registration_url

    else
      redirect_to root_url
    end
  end

  def failure
    redirect_to root_url
  end
end
