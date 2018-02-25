class Announcement < ApplicationRecord
  resourcify
  # 發布公告者
  belongs_to :announcer, class_name: 'User', foreign_key: :user_id
  # 驗證
  validates_presence_of  :title, :description, :content
end
