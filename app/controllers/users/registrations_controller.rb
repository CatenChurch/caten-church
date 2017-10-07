class Users::RegistrationsController < Devise::RegistrationsController
  include DeviseRedirectable
end
