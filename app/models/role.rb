class Role < ApplicationRecord
  has_and_belongs_to_many :users, :join_table => :users_roles

  belongs_to :resource,
             :polymorphic => true,
             :optional => true # if rails version > 5

  validates :resource_type,
            :inclusion => { :in => Rolify.resource_types },
            :allow_nil => true

  scopify
  
  # scope
  scope :group_leader, -> { Role.find_or_create_by!(name: 'leader', resource_type: 'Group') }
  scope :group_member, -> { Role.find_or_create_by!(name: 'member', resource_type: 'Group') }
end
