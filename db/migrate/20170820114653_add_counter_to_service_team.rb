class AddCounterToServiceTeam < ActiveRecord::Migration[5.0]
  def change
    add_column :service_teams, :schedules_count, :integer, default: 0, null: false
    add_column :service_teams, :users_count, :integer, default: 0, null: false
  end
end
