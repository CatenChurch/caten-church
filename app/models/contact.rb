# frozen_string_literal: true

class Contact < ApplicationRecord
  validates_presence_of :name, :email, :phone, :message
  validates_format_of :email, with: /\A([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})\z/i
end
