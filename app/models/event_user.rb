class EventUser < ApplicationRecord
  belongs_to :user
  belongs_to :event, counter_cache: :participants_count

  before_create :no_need_to_pay_fee, unless: :need_to_pay_fee?
  before_create :no_need_to_check_arrival, unless: :need_to_check_arrival?

  validates_uniqueness_of :user_id, scope: :event_id

  def need_to_pay_fee?
    event.registery_fee ? true : false
  end

  def need_to_check_arrival?
    event.check_arrival
  end

  private

  def no_need_to_pay_fee
    self.paid = true
  end

  def no_need_to_check_arrival
    self.arrival = true
  end

end
