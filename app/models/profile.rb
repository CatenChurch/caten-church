# frozen_string_literal: true

class Profile < ApplicationRecord
  attr_accessor :valid_for_joining_event

  belongs_to :user

  validates_presence_of :name, :sex, :birth
  validates_acceptance_of :terms_of_service
  # 有報名活動才填， profile.joining_event = true 來啟用驗證
  validates_presence_of :id_number, :emergency_contact, if: :valid_for_joining_event
  validates_format_of :id_number, with: /\A[a-z][1-2]\d{8}\z/i, if: :valid_for_joining_event

  def self.birth_month(month = nil)
    return all if month.blank?

    where('extract(month from birth) = ?', Integer(month))
  end
end
