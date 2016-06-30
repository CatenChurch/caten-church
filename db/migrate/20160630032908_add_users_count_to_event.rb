class AddUsersCountToEvent < ActiveRecord::Migration
  def change
  	add_column :events, :users_count, :integer, default: 0
  end
end
