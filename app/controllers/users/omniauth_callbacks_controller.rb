class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def facebook
    # You need to implement the method below in your model (e.g. app/models/user.rb)
    @oauth = Oauth.find_or_create_user(request.env["omniauth.auth"])

    if user_signed_in? && @oauth.no_one_connect_with?
      @oauth.connect current_user
      flash[:success] = "帳號與Facebook帳號連結成功"
      redirect_to root_url
    elsif user_signed_in?
      @oauth.is_connect_to?(current_user) ? flash[:info] = "此帳號已經與Facebook帳號連結了" : flash[:danger] = "此Facebook帳號已經與其他帳號與連結了"
      redirect_to root_url
    elsif !user_signed_in? && !@oauth.user.blank?
      sign_in_and_redirect @oauth.user, :event => :authentication #this will throw if @user is not activated
      flash[:notice] = "以Facebook帳號登入成功"
      flash[:info] = "此網站的帳號為Facebook的信箱，密碼隨機產生，可於之後更改密碼。第一次使用Facebook登入者，請填寫個人資料。" if is_first_time_sign_in?
    else
      flash[:warning] = "此用戶Facebook email已於此網站註冊過了，請登入後連結Facebook方能使用Facebook登入"
      session["email"] = request.env["omniauth.auth"]["info"]["email"]
      redirect_to new_user_session_url
    end
  end

  def failure
    redirect_to root_path
  end

  private
  def is_first_time_sign_in?
    @oauth.user.sign_in_count == 1
  end
end
