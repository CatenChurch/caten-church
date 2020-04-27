# frozen_string_literal: true

class DropService < ActiveRecord::Migration[6.0]
  def change
    drop_table :service_team_users
    Role.where(resource_type: 'Service::Team').destroy_all
    drop_table :service_schedules
    drop_table :service_teams
  end
end
