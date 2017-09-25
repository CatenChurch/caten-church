class Role < ApplicationRecord
  has_and_belongs_to_many :users, :join_table => :users_roles

  belongs_to :resource,
             :polymorphic => true
             # ,:optional => true # rails版本>5 才可用這行

  validates :resource_type,
            :inclusion => { :in => Rolify.resource_types },
            :allow_nil => true

  scopify

  has_many :service_team_users, class_name: 'Service::TeamUser', dependent: :nullify
end
