# == Schema Information
#
# Table name: event_users
#
#  id         :integer          not null, primary key
#  event_id   :integer
#  user_id    :integer
#  created_at :datetime         not null
#  updated_at :datetime         not null
#

class EventUser < ApplicationRecord
  belongs_to :user
  belongs_to :event, counter_cache: :participants_count

  before_create :no_need_to_pay_fee, unless: :need_to_pay_fee?
  before_create :no_need_to_check_arrival, unless: :need_to_check_arrival?

  def need_to_pay_fee?
    event.registery_fee ? true : false
  end

  def need_to_check_arrival?
    event.check_arrival
  end

  private

  def no_need_to_pay_fee
    p 'paid = true'
    self.paid = true
  end

  def no_need_to_check_arrival
    p 'arrival = true'
    self.arrival = true
  end
end
