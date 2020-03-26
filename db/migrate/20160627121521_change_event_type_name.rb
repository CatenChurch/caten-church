# frozen_string_literal: true

class ChangeEventTypeName < ActiveRecord::Migration[4.2]
  def change
    rename_column :events, :type, :nature
  end
end
