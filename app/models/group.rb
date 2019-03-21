class Group < ApplicationRecord
  resourcify

  # relations
  has_many :reports, class_name: 'GroupReport', dependent: :destroy
  has_one :current_week_report, -> { where(meeting_time: (Time.now - 7.days)..Time.now).order(id: :desc) }, class_name: 'GroupReport'
  has_one :prev_week_report, -> { where(meeting_time: (Time.now - 14.days)..(Time.now - 7.days)).order(id: :desc) }, class_name: 'GroupReport'
  belongs_to :creater, class_name: 'User', optional: true
  has_many :group_users, dependent: :destroy
  has_many :users, through: :group_users, source: :user
  has_one :leader_group_user, -> { where(role: Role.group_leader) }, class_name: 'GroupUser'
  has_one :leader, through: :leader_group_user, source: :user

  # validations
  validates_presence_of :name, :introduction
  validates_uniqueness_of :name

  def change_leader(user)
    unless user == leader
      ApplicationRecord.transaction do
        leader_group_user&.be_member!
        group_users.find_or_create_by!(user: user).be_leader!
      end
    end
  end

  def week_report(prev: false)
    prev ? prev_week_report : current_week_report
  end
end
