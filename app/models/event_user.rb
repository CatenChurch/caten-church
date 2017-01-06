# == Schema Information
#
# Table name: event_users
#
#  id         :integer          not null, primary key
#  event_id   :integer
#  user_id    :integer
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

class EventUser < ActiveRecord::Base
	# event有哪些user參加的關聯表
	belongs_to :user
	belongs_to :event ,counter_cache: :participants_count
end
