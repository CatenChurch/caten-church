# frozen_string_literal: true

class AddPostsCountToGroup < ActiveRecord::Migration[4.2]
  def change
    add_column :groups, :posts_count, :integer, default: 0
  end
end
