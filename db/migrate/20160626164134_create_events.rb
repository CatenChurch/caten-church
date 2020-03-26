# frozen_string_literal: true

class CreateEvents < ActiveRecord::Migration[4.2]
  def change
    create_table :events do |t|
      t.string :name
      t.string :type
      t.text :description
      t.integer :max_sign_up_number
      t.integer :min_sign_up_number
      t.datetime :sign_up_begin
      t.datetime :sign_up_end
      t.datetime :start
      t.datetime :over

      t.timestamps null: false
    end
  end
end
