class GroupReport < ApplicationRecord
  belongs_to :group, counter_cache: :reports_count
  belongs_to :creater, class_name: 'User', optional: true

  validates_presence_of :adults_count, :dedication, :meeting_time, :meeting_place
  validates_numericality_of :adults_count, :children_count, :dedication
end
