class CreateGroupReports < ActiveRecord::Migration[5.1]
  def change
    create_table :group_reports do |t|
      t.integer :adults_count
      t.integer :children_count
      t.integer :dedication
      t.datetime :next_meeting_time
      t.string :next_meeting_place
      t.references :group, foreign_key: true
      t.references :creater, foreign_key: {to_table: :users}

      t.timestamps
    end

    add_column :groups, :reports_count, :integer, default: 0
  end
end
