# frozen_string_literal: true

class Role < ApplicationRecord
  has_and_belongs_to_many :users, join_table: :users_roles

  belongs_to :resource, polymorphic: true, optional: true

  validates :resource_type, inclusion: { in: Rolify.resource_types }, allow_nil: true

  scopify

  # ransack (admin member search by role)
  def self.ransackable_attributes(_auth_object = nil)
    %w[id name]
  end

  def self.ransackable_associations(_auth_object = nil)
    []
  end

  # scope
  scope :group_leader, -> { Role.find_or_create_by!(name: 'leader', resource_type: 'Group') }
  scope :group_member, -> { Role.find_or_create_by!(name: 'member', resource_type: 'Group') }
end
