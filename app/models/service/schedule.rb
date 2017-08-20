class Service::Schedule < ApplicationRecord
  belongs_to :team, foreign_key: 'service_team_id', counter_cache: :schedules_count
end
