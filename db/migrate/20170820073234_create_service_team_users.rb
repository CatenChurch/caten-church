class CreateServiceTeamUsers < ActiveRecord::Migration[5.0]
  def change
    create_table :service_team_users do |t|
      t.references :user, foreign_key: true, index: true
      t.references :role, foreign_key: true, index: true
      t.references :service_team, foreign_key: true, index: true
      t.timestamps
    end
  end
end
