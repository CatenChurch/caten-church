class Post < ActiveRecord::Base
	# group中post
	belongs_to :group
	# post中的content不能為空
	validates :content, presence: true
	# post與user的關係
	belongs_to :author, class_name: "User", foreign_key: :user_id
	# 有無修改權限
	def editable_by?(user)
	   user && user == author
 	end
end
