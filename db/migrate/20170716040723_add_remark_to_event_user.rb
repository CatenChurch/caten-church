class AddRemarkToEventUser < ActiveRecord::Migration[5.0]
  def change
    add_column :event_users, :remark, :string, default: nil
    add_index :event_users, :event_id
    add_index :event_users, :user_id
    add_index :event_users, [:event_id, :user_id], unique: true
  end
end
