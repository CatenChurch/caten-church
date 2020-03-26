# frozen_string_literal: true

class AddUsersCountToEvent < ActiveRecord::Migration[4.2]
  def change
    add_column :events, :users_count, :integer, default: 0
  end
end
