json.users @members do |user|
  json.id user.id
  json.email user.email
  json.name user.profile&.name
end
