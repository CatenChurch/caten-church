class Event < ApplicationRecord
  resourcify

  # scope
  scope :running, -> { where('start < :now and over > :now', now: DateTime.now) }
  scope :sign_up_expired, -> { where('sign_up_end < :now', now: DateTime.now) }
  scope :in_registration_time, -> { where('sign_up_end >= :now and sign_up_begin <= :now', now: DateTime.now) }
  scope :closed, -> { where('over < :now', now: DateTime.now) }

  # relation
  belongs_to :organizer, class_name: 'User', foreign_key: :user_id
  has_many :event_users, dependent: :destroy
  has_many :participants, through: :event_users, source: :user

  # valid
  validates_presence_of :name, :max_sign_up_number, :sign_up_begin, :sign_up_end, :start, :over
  validates_numericality_of :registery_fee, allow_nil: true
  validate :my_valid

  # instance method
  def full?
    participants_count >= max_sign_up_number
  end

  def on_registration?
    now = DateTime.now.to_i
    sign_up_begin.to_i <= now && now <= sign_up_end.to_i
  end

  def show_participants_count
    show_participants ? participants_count : '?'
  end

  private

  def my_valid
    errors[:max_sign_up_number] << '報名活動的人數上限要比活動成立的人數高吧!' if max_sign_up_number.to_i < min_sign_up_number.to_i
    errors[:sign_up_end] << '結束報名的時間要比開始報名的時間後面喔!' if sign_up_begin.to_i >= sign_up_end.to_i
    errors[:start] << '活動開始的時間要比活動結束的時間還前面吧!' if start.to_i >= over.to_i
    errors[:over] << '報名截止的時間要在活動結束的時間之前喔!' if sign_up_end.to_i >= over.to_i
  end
end
