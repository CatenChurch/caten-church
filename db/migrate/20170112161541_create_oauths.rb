# frozen_string_literal: true

class CreateOauths < ActiveRecord::Migration[4.2]
  def change
    create_table :oauths do |t|
      t.references :user, index: true, foreign_key: true
      t.string :provider
      t.string :uid

      t.timestamps null: false
    end
  end
end
