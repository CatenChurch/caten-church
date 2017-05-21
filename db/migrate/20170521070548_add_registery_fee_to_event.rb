class AddRegisteryFeeToEvent < ActiveRecord::Migration[5.0]
  def change
    add_column :events, :registery_fee, :integer, default: nil
    add_column :events, :check_arrival, :boolean, default: false
    add_index :events, :check_arrival

    rename_column :event_users, :activated, :paid
    change_column_default :event_users, :paid, false
    add_column :event_users, :arrival, :boolean, default: false
  end
end
