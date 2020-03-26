# frozen_string_literal: true

class DropPosts < ActiveRecord::Migration[4.2]
  def change
    drop_table :posts
  end
end
