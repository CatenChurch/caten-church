# frozen_string_literal: true

class CreatePosts < ActiveRecord::Migration[4.2]
  def change
    create_table :posts do |t|
      t.text :content
      t.integer :group_id

      t.timestamps null: false
    end

    create_table :groups do |t|
      t.timestamps null: false
    end

    create_table :group_users do |t|
      t.timestamps null: false
    end
  end
end
