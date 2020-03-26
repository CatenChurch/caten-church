# frozen_string_literal: true

class ChangeEventUsersCountName < ActiveRecord::Migration[4.2]
  def change
    rename_column :events, :users_count, :participants_count
  end
end
