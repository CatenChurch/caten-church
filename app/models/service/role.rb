class Service::Role < Role
  has_many :service_team_users, class_name: 'Service::TeamUser', dependent: :nullify
end
