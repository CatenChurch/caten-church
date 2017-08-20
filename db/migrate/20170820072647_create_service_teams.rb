class CreateServiceTeams < ActiveRecord::Migration[5.0]
  def change
    create_table :service_teams do |t|
      t.references :user, foreign_key: true, index: true
      t.string :name
      t.timestamps
    end
  end
end
