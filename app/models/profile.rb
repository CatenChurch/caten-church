# == Schema Information
#
# Table name: profiles
#
#  id         :integer          not null, primary key
#  name       :string
#  sex        :string
#  birth      :date
#  phone      :string
#  cellphone  :string
#  address    :string
#  education  :string
#  user_id    :integer
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

class Profile < ApplicationRecord
  scope :birth_month, ->(month) {
                        return all if month.blank?
                        month = Integer(month)
                        where('extract(month from birth) = ?', month)
                      }

  belongs_to :user

  validates_presence_of :name, :sex, :birth, :emergency_contact
  validates_format_of :id_number, with: /\A[a-z][1-2]\d{8}\z/i, message: I18n.t('profile.error.id_number')
  validates :terms_of_service, acceptance: true
  # validate :myValid

  private

  # def myValid; end
end
