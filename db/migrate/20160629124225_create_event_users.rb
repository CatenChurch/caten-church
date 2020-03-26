# frozen_string_literal: true

class CreateEventUsers < ActiveRecord::Migration[4.2]
  def change
    create_table :event_users do |t|
      t.integer :event_id
      t.integer :user_id

      t.timestamps null: false
    end
  end
end
