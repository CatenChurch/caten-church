class RenameEventsDescriptionToContent < ActiveRecord::Migration[6.0]
  def change
    rename_column :events, :description, :content
  end
end
