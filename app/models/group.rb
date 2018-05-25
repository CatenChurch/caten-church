class Group < ApplicationRecord
  # relations
  resourcify
  belongs_to :creater, class_name: 'User', foreign_key: :creater_id
  has_many :group_users, dependent: :destroy
  has_many :users, through: :group_users, source: :user
  has_one :leader_group_user, -> { where(role: Role.group_leader) }, class_name: 'GroupUser'
  has_one :leader, through: :leader_group_user, source: :user

  # validations
  validates_presence_of :name, :introduction
  validates_uniqueness_of :name

  # scopes
  scope :leader_role, -> { Role.find_or_create_by!(name: '組長', resource_type: 'Group') }
  scope :member_role, -> { Role.find_or_create_by!(name: '組員', resource_type: 'Group') }

  def change_leader(user)
    unless user == leader
      ApplicationRecord.transaction do
        leader_group_user&.be_member!
        group_users.find_or_create_by!(user: user).be_leader!
      end
    end
  end
end
