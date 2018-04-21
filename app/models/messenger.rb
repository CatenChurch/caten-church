class Messenger < ApplicationRecord
  belongs_to :user

  validates_uniqueness_of :provider, scope: :uid
  validates_uniqueness_of :user_id, scope: :provider, if: Proc.new { |oauth| oauth.user_id.present? }
end
