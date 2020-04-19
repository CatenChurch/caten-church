# frozen_string_literal: true

class DropAnnouncements < ActiveRecord::Migration[6.0]
  def change
    drop_table :announcements
  end
end
