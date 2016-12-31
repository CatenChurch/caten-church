class AddUserIdToAnnouncements < ActiveRecord::Migration
  def change
    add_reference :announcements, :user, foreign_key: true
  end
end
