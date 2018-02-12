class Service::Team < ApplicationRecord
  resourcify

  belongs_to :leader, class_name: 'User', foreign_key: 'user_id'

  has_many :team_users, foreign_key: 'service_team_id', counter_cache: :users_count, dependent: :destroy
  has_many :users, through: :team_users, source: :user, counter_cache: :users_count
  has_many :schedules, foreign_key: 'service_team_id', counter_cache: :schedules_count, dependent: :destroy

  accepts_nested_attributes_for :team_users, allow_destroy: true, reject_if: :all_blank

  validates_presence_of :name
end
