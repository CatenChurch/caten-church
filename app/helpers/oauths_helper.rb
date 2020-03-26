# frozen_string_literal: true

module OauthsHelper
  def connect_facebook_link(user)
    if user.facebook_oauth.present?
      link_to "https://www.facebook.com/#{current_user.facebook_oauth.uid}", target: :_blank, class: 'btn btn-outline-primary list-group-item' do
        icon 'fab', 'facebook', '已連結', class: 'fa-3x'
      end
    else
      link_to user_facebook_omniauth_authorize_path, class: 'btn btn-outline-primary list-group-item' do
        icon 'fab', 'facebook', '尚未連結', class: 'fa-3x'
      end
    end
  end

  def connect_google_link(_user)
    link_to '#google-login-is-coming', class: 'btn list-group-item disabled' do
      icon 'fab', 'google', '即將推出', class: 'fa-3x'
    end
  end

  def connect_instagram_link(_user)
    link_to '#instagram-login-is-coming', class: 'btn list-group-item disabled' do
      icon 'fab', 'instagram', '即將推出', class: 'fa-3x'
    end
  end
end
