# frozen_string_literal: true

class RemoveOmniauthFromUsers < ActiveRecord::Migration[4.2]
  def change
    remove_column :users, :provider, :string
    remove_column :users, :uid, :string
  end
end
