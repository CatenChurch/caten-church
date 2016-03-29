class Post < ActiveRecord::Base
	# group中post 會計算有幾篇post
	# counter_cache: :posts_count 的功能
	# 只要 post 有 create 跟 destroy 的動作
	# 就會自動在 posts_count 欄位 +1 跟 -1
	belongs_to :group, counter_cache: :posts_count
	# post中的content不能為空
	validates :content, presence: true
	# post與user的關係
	belongs_to :author, class_name: "User", foreign_key: :user_id
	# 有無修改權限
	def editable_by?(user)
	   user && user == author
 	end
end
