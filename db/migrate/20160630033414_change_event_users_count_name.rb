class ChangeEventUsersCountName < ActiveRecord::Migration
  def change
  	rename_column :events, :users_count, :participants_count
  end
end
