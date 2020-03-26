# frozen_string_literal: true

class RenameEventsNatureToDescription < ActiveRecord::Migration[6.0]
  def change
    rename_column :events, :nature, :description
  end
end
