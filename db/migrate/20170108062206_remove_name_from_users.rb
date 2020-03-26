# frozen_string_literal: true

class RemoveNameFromUsers < ActiveRecord::Migration[4.2]
  def change
    remove_column :users, :name
  end
end
