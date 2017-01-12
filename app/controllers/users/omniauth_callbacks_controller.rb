class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def facebook
    # You need to implement the method below in your model (e.g. app/models/user.rb)
    @oauth = Oauth.find_or_create_user(request.env["omniauth.auth"])
    @user = @oauth.user

    if @user.persisted?
      sign_in_and_redirect @user, :event => :authentication #this will throw if @user is not activated
      set_flash_message(:notice, :success, :kind => "Facebook") if is_navigational_format?
      flash[:notice] = "此網站的帳號為Facebook的信箱，密碼隨機產生，可於之後更改密碼。第一次使用Facebook登入者，請填寫個人資料。"
    else
      flash[:warning] = "此用戶Facebook email已於此網站註冊過了，請登入後連結Facebook方能使用Facebook登入"
      session["devise.facebook_data"] = request.env["omniauth.auth"]
      session["email"] = session["devise.facebook_data"]["info"]["email"]
      redirect_to new_user_session_url
    end
  end

  def failure
    redirect_to root_path
  end
end
