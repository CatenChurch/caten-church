# frozen_string_literal: true

class Messenger < ApplicationRecord
  belongs_to :user

  validates_uniqueness_of :provider, scope: :uid
  validates_uniqueness_of :user_id, scope: :provider, if: proc { |oauth| oauth.user_id.present? }
end
