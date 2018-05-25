class GroupUser < ApplicationRecord
  # relations
  belongs_to :group, counter_cache: :members_count
  belongs_to :user
  belongs_to :role
end
