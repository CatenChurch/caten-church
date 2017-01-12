class CreateOauths < ActiveRecord::Migration
  def change
    create_table :oauths do |t|
      t.references :user, index: true, foreign_key: true
      t.string :provider
      t.string :uid

      t.timestamps null: false
    end
  end
end
