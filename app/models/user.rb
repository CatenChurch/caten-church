class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
  :recoverable, :rememberable, :trackable, :validatable
  # 設定 user 跟 group 之間的資料庫關聯
  has_many :groups
  has_many :posts
  # user has many group_users
  # user has many participated_groups from group, and save in group_user
  has_many :group_users
  has_many :participated_groups, through: :group_users, source: :group
  # 一個 user 有一個 user_profile
  has_one :profile, dependent: :destroy
  # event
  has_many :events

  # 把 group 放入 participated_groups
  def join!(group)
    participated_groups << group
  end
  # 把 participated_groups 中的 group 刪除
  def quit!(group)
    participated_groups.delete(group)
  end



  # 確認 user 是否為此 group 的 members
  def is_member_of?(group)
    participated_groups.include?(group)
  end
end
