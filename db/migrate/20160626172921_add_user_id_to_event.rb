# frozen_string_literal: true

class AddUserIdToEvent < ActiveRecord::Migration[4.2]
  def change
    add_column :events, :user_id, :integer
  end
end
