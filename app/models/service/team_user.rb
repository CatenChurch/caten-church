class Service::TeamUser < ApplicationRecord
  belongs_to :user
  belongs_to :team, foreign_key: 'service_team_id', counter_cache: :users_count
  belongs_to :role

  validates_presence_of :user, :role
end
