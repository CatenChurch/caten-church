class Profile < ApplicationRecord
  belongs_to :user

  validates_presence_of :name, :sex, :birth, :emergency_contact, :id_number
  validates_format_of :id_number, with: /\A[a-z][1-2]\d{8}\z/i
  validates_acceptance_of :terms_of_service

  def self.birth_month(month=nil)
    return all if month.blank?
    where('extract(month from birth) = ?', Integer(month))
  end
end
