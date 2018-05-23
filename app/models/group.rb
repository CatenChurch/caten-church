class Group < ApplicationRecord
  # relations
  belongs_to :creater, class_name: 'User', foreign_key: :creater_id
  has_many :group_users, dependent: :destroy
  has_many :users, through: :group_users, source: :user

  # roles
  resourcify
end
