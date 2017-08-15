class AddHandledToContact < ActiveRecord::Migration[5.0]
  def change
    add_column :contacts, :handled, :boolean, default: false
  end
end
