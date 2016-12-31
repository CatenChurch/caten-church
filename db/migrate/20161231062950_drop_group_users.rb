class DropGroupUsers < ActiveRecord::Migration
  def change
    drop_table :group_users
  end
end
