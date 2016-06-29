class EventUser < ActiveRecord::Base
	# event有哪些user參加的關聯表
	belongs_to :user
	belongs_to :event
end
