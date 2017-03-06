# == Schema Information
#
# Table name: announcements
#
#  id          :integer          not null, primary key
#  title       :string
#  description :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  content     :text
#  user_id     :integer
#

class Announcement < ApplicationRecord
  resourcify
  # 發布公告者
  belongs_to :announcer, class_name: "User", foreign_key: :user_id
  # 驗證
  validates_presence_of  :title, :description, :content
end
