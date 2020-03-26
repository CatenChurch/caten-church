# frozen_string_literal: true

class AddUserIdToPost < ActiveRecord::Migration[4.2]
  def change
    add_column :posts, :user_id, :integer
  end
end
