# frozen_string_literal: true

class AddUserIdToAnnouncements < ActiveRecord::Migration[4.2]
  def change
    add_reference :announcements, :user, foreign_key: true
  end
end
