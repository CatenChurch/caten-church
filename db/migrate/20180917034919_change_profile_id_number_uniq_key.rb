class ChangeProfileIdNumberUniqKey < ActiveRecord::Migration[5.1]
  def change
    remove_index :profiles, :cellphone
    remove_index :profiles, :id_number
    remove_index :profiles, :name
    remove_index :profiles, :phone
    remove_index :profiles, :sex
  end
end
