class CreateProfiles < ActiveRecord::Migration
  def change
    create_table :profiles do |t|
    	
      t.string :name
      t.string :sex
      t.date :birth
      t.string :phone
      t.string :cellphone
      t.string :email
      t.string :address
      t.string :education
      t.references :user, index: true, foreign_key: true

      t.timestamps null: false
    end
  end
end
