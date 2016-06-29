class Event < ActiveRecord::Base
	# 活動發起者
	belongs_to :organizer, class_name: "User", foreign_key: :user_id
	
	# event has many event_users
	# event has many members from user, and save in group_user
	# 刪除 event 會清空報名event的人的資料(participants)
	has_many :event_users
    has_many :participants, through: :event_users, source: :user, dependent: :destroy
	
	# 修改權限
	def editable_by?(user)
    	user && user == organizer
    end
end
