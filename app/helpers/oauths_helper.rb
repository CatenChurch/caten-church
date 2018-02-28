module OauthsHelper
  def connect_facebook_link(user)
    if user.facebook_oauth.present?
      link_to "https://www.facebook.com/#{current_user.facebook_oauth.uid}", target: :_blank, class: 'btn btn-outline-primary list-group-item' do
        fa_icon('facebook-official 3x', text: t('.oauths_helper.success'))
      end
    else
      link_to user_facebook_omniauth_authorize_path, class: 'btn btn-outline-primary list-group-item' do
        fa_icon('facebook-official 3x', text: t('.oauths_helper.none'))
      end
    end
  end

  def connect_google_link(user)
    link_to "#google-login-is-coming", class: 'btn list-group-item disabled' do
      fa_icon('google 3x', text: t('.oauths_helper.pending'))
    end
  end

  def connect_instagram_link(user)
    link_to "#instagram-login-is-coming", class: 'btn list-group-item disabled' do
      fa_icon('instagram 3x', text: t('.oauths_helper.pending'))
    end
  end
end
