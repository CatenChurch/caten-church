# frozen_string_literal: true

class RemoveEmailFromProfiles < ActiveRecord::Migration[4.2]
  def change
    remove_column :profiles, :email
  end
end
