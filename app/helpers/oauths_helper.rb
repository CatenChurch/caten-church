module OauthsHelper
  def connect_facebook_link(user)
    if user.facebook_oauth.present?
      link_to "https://www.facebook.com/#{current_user.facebook_oauth.uid}", target: :_blank, class: 'btn btn-outline-primary list-group-item' do
        icon 'fab', 'facebook', t('.oauths_helper.success'), class: 'fa-3x'
      end
    else
      link_to user_facebook_omniauth_authorize_path, class: 'btn btn-outline-primary list-group-item' do
        icon 'fab', 'facebook', t('.oauths_helper.none'), class: 'fa-3x'
      end
    end
  end

  def connect_google_link(_user)
    link_to '#google-login-is-coming', class: 'btn list-group-item disabled' do
      icon 'fab', 'google', t('.oauths_helper.pending'), class: 'fa-3x'
    end
  end

  def connect_instagram_link(_user)
    link_to '#instagram-login-is-coming', class: 'btn list-group-item disabled' do
      icon 'fab', 'instagram', t('.oauths_helper.pending'), class: 'fa-3x'
    end
  end
end
