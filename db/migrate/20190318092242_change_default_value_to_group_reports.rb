class ChangeDefaultValueToGroupReports < ActiveRecord::Migration[5.1]
  def change
    change_column_default(:group_reports, :adults_count, 0)
    change_column_default(:group_reports, :children_count, 0)
    change_column_default(:group_reports, :dedication, 0)
  end
end
