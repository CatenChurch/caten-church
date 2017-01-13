class Oauth < ActiveRecord::Base
  belongs_to :user

  def self.find_or_create_user(auth)
    where(provider: auth.provider, uid: auth.uid).first_or_create do |oauth|
      if oauth.user.blank? && !User.email_has_been_used?(auth.info.email)
        puts "create user"
        oauth.create_user(email: auth.info.email, password: Devise.friendly_token[0,20])
      end
    end
  end

  def connect(u)
    update!(user: u)
  end

  def disconnect
    update!(user: nil)
  end

  def is_connect_to?(u)
    user == u
  end

  def no_one_connect_with?
    user.blank?
  end

end
