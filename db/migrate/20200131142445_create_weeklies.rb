# frozen_string_literal: true

class CreateWeeklies < ActiveRecord::Migration[6.0]
  def change
    create_table :weeklies do |t|
      t.string :title
      t.integer :issue
      t.datetime :published_at

      t.timestamps
    end
  end
end
