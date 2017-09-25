class CreateServiceSchedules < ActiveRecord::Migration[5.0]
  def change
    create_table :service_schedules do |t|
      t.references :service_team, foreign_key: true, index: true
      t.datetime :service_time
      t.timestamps
    end
  end
end
