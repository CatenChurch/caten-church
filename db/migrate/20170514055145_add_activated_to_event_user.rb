class AddActivatedToEventUser < ActiveRecord::Migration[5.0]
  def change
    add_column :event_users, :activated, :boolean, default: false
  end
end
