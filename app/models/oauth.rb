class Oauth < ApplicationRecord
  belongs_to :user

  validates_presence_of :provider, :uid
  # db schema 有加 uniq key 限制，故此應用層的驗證可註解掉
  # validates_uniqueness_of :provider, scope: :uid
  validates_uniqueness_of :user_id, scope: :provider, if: Proc.new { |oauth| oauth.user_id.present? }

  def self.find_or_create_user(auth)
    where(provider: auth.provider, uid: auth.uid).first_or_create do |oauth|
      if !oauth.user_id? && !User.exists?(email: auth.info.email)
        oauth.create_user(email: auth.info.email, password: Devise.friendly_token[0,20])
        Rails.logger.info "User #{oauth.user.id} created."
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
