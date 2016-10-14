class AddContentToAnnouncements < ActiveRecord::Migration
  def change
    add_column :announcements, :content , :text
    change_column :announcements, :description , :string
  end
end
