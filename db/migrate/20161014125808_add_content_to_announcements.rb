# frozen_string_literal: true

class AddContentToAnnouncements < ActiveRecord::Migration[4.2]
  def change
    add_column :announcements, :content, :text
    change_column :announcements, :description, :string
  end
end
