# frozen_string_literal: true

class Oauth < ApplicationRecord
  belongs_to :user, optional: true

  validates_presence_of :provider, :uid
  # db schema 有加 uniq key 限制，故此應用層的驗證可註解掉
  # validates_uniqueness_of :provider, scope: :uid
  validates_uniqueness_of :user_id, scope: :provider, if: proc { |oauth| oauth.connected? }

  def connected?
    user_id.present?
  end

  def connect(user)
    update!(user: user)
  end

  # NOTE: Unused instance function: oauth#disconnect
  def disconnect
    update!(user: nil)
  end

  def refresh(token)
    update!(token: token)
  end
end
