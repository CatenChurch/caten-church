class Group < ApplicationRecord
  # relations
  has_many :reports, class_name: 'GroupReport', dependent: :destroy
  has_one :last_report, -> { order id: :desc }, class_name: 'GroupReport'
  has_one :week_report, -> { where(created_at: Time.now.beginning_of_week..Time.now.end_of_week).order(id: :desc) }, class_name: 'GroupReport'
  has_one :prev_week_report, -> { where(created_at: Time.now.prev_week.beginning_of_week..Time.now.prev_week.end_of_week).order(id: :desc) }, class_name: 'GroupReport'
  belongs_to :creater, class_name: 'User', optional: true
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
