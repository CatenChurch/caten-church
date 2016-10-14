class Announcement < ActiveRecord::Base
  resourcify
  # 驗證
  validates_presence_of  :title, :description, :content
end
