class Profile < ApplicationRecord
  belongs_to :user

  validates_presence_of :name, :sex, :birth, :emergency_contact, :id_number
  validates_format_of :id_number, with: /\A[a-z][1-2]\d{8}\z/i, message: I18n.t('profile.error.id_number')
  validates :terms_of_service, acceptance: true

  def self.birth_month(month=nil)
    return all if month.blank?
    where('extract(month from birth) = ?', Integer(month))
  end
end
