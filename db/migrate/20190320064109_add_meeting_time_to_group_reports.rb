class AddMeetingTimeToGroupReports < ActiveRecord::Migration[5.1]
  def change
    add_column :group_reports, :meeting_time, :datetime
    add_column :group_reports, :meeting_place, :string
  end
end
