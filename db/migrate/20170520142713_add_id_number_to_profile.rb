class AddIdNumberToProfile < ActiveRecord::Migration[5.0]
  def change
    add_column :profiles, :id_number, :string
    add_column :profiles, :emergency_contact, :string
    add_index :profiles, :id_number, unique: true
  end
end
