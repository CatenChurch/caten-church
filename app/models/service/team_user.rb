# frozen_string_literal: true

class Service::TeamUser < ApplicationRecord
  belongs_to :user
  belongs_to :team, foreign_key: 'service_team_id', counter_cache: :users_count, optional: true
  belongs_to :role
end
