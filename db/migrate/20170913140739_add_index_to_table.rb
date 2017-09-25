class AddIndexToTable < ActiveRecord::Migration[5.0]
  def change
    add_index :profiles, :name
    add_index :profiles, :sex
    add_index :profiles, :birth
    add_index :profiles, :phone
    add_index :profiles, :cellphone

    add_index :service_teams, :name

    add_column :oauths, :token, :text
    add_index :oauths, [:provider, :uid], unique: true

    add_index :events, :name
    add_index :events, :sign_up_begin
    add_index :events, :sign_up_end
    add_index :events, :start
    add_index :events, :over

    add_index :contacts, :handled
  end
end
