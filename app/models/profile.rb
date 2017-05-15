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

  # 必填欄位
  validates_presence_of :name, :sex, :birth
  # 同意規範
  validates :terms_of_service, acceptance: true
  # 自訂驗證
  validate :myValid

  private

  def myValid; end
end
