class AddSequenceToGroups < ActiveRecord::Migration[5.1]
  def change
    add_column :groups, :sequence, :integer
    add_index :groups, :sequence
  end
end
