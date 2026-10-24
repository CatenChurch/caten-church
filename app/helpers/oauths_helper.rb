# frozen_string_literal: true

module OauthsHelper
  def connect_facebook_link(user)
    if user.facebook_oauth.present?
      link_to "https://www.facebook.com/#{current_user.facebook_oauth.uid}",
              target: :_blank,
              rel: :noopener,
              class: 'btn btn-outline-primary list-group-item' do
        content_tag(:i, nil, class: 'fab fa-facebook fa-3x me-1') + '已連結'
      end
    else
      # OmniAuth needs a real POST form (not a Turbo fetch) so the browser can follow the redirect to Facebook.
      button_to user_facebook_omniauth_authorize_path,
                class: 'btn btn-outline-primary w-100 rounded-0 border-0 py-2',
                form: { class: 'list-group-item p-0', data: { turbo: false } } do
        content_tag(:i, nil, class: 'fab fa-facebook fa-3x me-1') + '尚未連結'
      end
    end
  end

  def connect_google_link(_user)
    link_to '#google-login-is-coming', class: 'btn list-group-item disabled' do
      content_tag(:i, nil, class: 'fab fa-google fa-3x me-1') + '即將推出'
    end
  end

  def connect_instagram_link(_user)
    link_to '#instagram-login-is-coming',
            class: 'btn list-group-item disabled' do
      content_tag(:i, nil, class: 'fab fa-instagram fa-3x me-1') + '即將推出'
    end
  end
end
