# frozen_string_literal: true

class CreateAnnouncements < ActiveRecord::Migration[4.2]
  def change
    create_table :announcements do |t|
      t.string :title
      t.text :description
      t.timestamps null: false
    end
  end
end
