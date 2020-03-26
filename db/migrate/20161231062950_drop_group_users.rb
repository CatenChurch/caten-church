# frozen_string_literal: true

class DropGroupUsers < ActiveRecord::Migration[4.2]
  def change
    drop_table :group_users
  end
end
