class AddIndexToServiceSchedules < ActiveRecord::Migration[5.0]
  def change
    add_index :service_schedules, :service_time
  end
end
