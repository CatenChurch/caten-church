class AddDefaultToEvent < ActiveRecord::Migration[5.0]
  def change
    change_column_default :events, :registery_fee, 0
  end
end
