class Event < ActiveRecord::Base
	# 活動發起者
	belongs_to :organizer, class_name: "User", foreign_key: :user_id
	
	# 修改權限
	def editable_by?(user)
    	user && user == organizer
    end
end
