json.users @members do |user|
  json.id user.id
  json.name user.profile.try(:name)
end
