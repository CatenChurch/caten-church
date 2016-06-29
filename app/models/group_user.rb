class GroupUser < ActiveRecord::Base
	# group有哪些user參加的關聯表
	belongs_to :user
	belongs_to :group
end
