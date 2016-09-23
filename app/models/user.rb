class User < ActiveRecord::Base
  rolify
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
  # user has many event_users
  # user has many participated_events from event, and save in event_user
  has_many :event_users
  has_many :participated_events, through: :event_users, source: :event
  
  # 管理人員
  def is_manager?
    self &&  self.has_any_role?(:admin)
  end

  # 把 group 放入 participated_groups
  def join_group(group)
    participated_groups << group
  end
  # 把 participated_groups 中的 group 刪除
  def quit_group(group)
    participated_groups.delete(group)
  end
  # 確認 user 是否為此 group 的 members
  def is_member_of_group?(group)
    participated_groups.include?(group)
  end


  # 把 event 放入 participated_events
  def join_event(event)
    participated_events << event
  end
  # 把 participated_events 中的 event 刪除
  def quit_event(event)
    participated_events.delete(event)
  end
  # 確認 user 是否為此 group 的 members
  def is_participant_of_event?(event)
    participated_events.include?(event)
  end

  

  
end
