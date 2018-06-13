class GroupReport < ApplicationRecord
  belongs_to :group, counter_cache: :reports_count
  belongs_to :creater, class_name: 'User', optional: true

  validates_presence_of :adults_count, :children_count, :dedication, :next_meeting_time, :next_meeting_place
  validates_numericality_of :adults_count, :children_count, :dedication
end
