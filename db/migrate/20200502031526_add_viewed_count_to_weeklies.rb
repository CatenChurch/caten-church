# frozen_string_literal: true

class AddViewedCountToWeeklies < ActiveRecord::Migration[6.0]
  def change
    add_column :weeklies, :viewed_count, :integer, default: 0
  end
end
