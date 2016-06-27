class ChangeEventTypeName < ActiveRecord::Migration
  def change
  	rename_column :events, :type, :nature
  end
end
