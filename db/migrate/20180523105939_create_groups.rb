class CreateGroups < ActiveRecord::Migration[5.1]
  def change
    create_table :groups do |t|
      t.string :name
      t.references :creater, foreign_key: {to_table: :users}
      t.string :introduction
      t.text :description

      t.timestamps
    end
  end
end
