class CreateMessengers < ActiveRecord::Migration[5.1]
  def change
    create_table :messengers do |t|
      t.string :provider
      t.string :uid
      t.boolean :activated, default: false
      t.references :user, foreign_key: true

      t.timestamps
    end
    add_index :messengers, :activated
    add_index :messengers, [:provider, :uid], unique: true
  end
end
