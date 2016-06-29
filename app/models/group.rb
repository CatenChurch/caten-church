class Group < ActiveRecord::Base
	# 使title不為空白
	validates :title, presence: true
	# 建立與 models > post.rb 之間的關聯 group有許多post
	# dependent: :destroy 刪除group會連帶刪除它的posts
	has_many :posts, dependent: :destroy
	# group has many group_users
	# group has many members from user, and save in group_user
	# 刪除 group 會刪除參加 group 的 members
	has_many :group_users
    has_many :members, through: :group_users, source: :user, dependent: :destroy
	# 設定 user 跟 group 之間的資料庫關聯
	belongs_to :owner, class_name: "User", foreign_key: :user_id
	# 驗證目前的登入的使用者為作者
	def editable_by?(user)
    	user && user == owner
    end
end
