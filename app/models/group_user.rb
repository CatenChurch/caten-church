class GroupUser < ApplicationRecord
  # relations
  belongs_to :group, counter_cache: :members_count
  belongs_to :user
  belongs_to :role

  before_validation do
    self.role ||= Role.group_member
  end

  def be_leader!
    update!(role: Role.group_leader)
  end

  def be_member!
    update!(role: Role.group_member)
  end
end
