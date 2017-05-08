# == Schema Information
#
# Table name: events
#
#  id                 :integer          not null, primary key
#  name               :string
#  nature             :string
#  description        :text
#  max_sign_up_number :integer
#  min_sign_up_number :integer
#  sign_up_begin      :datetime
#  sign_up_end        :datetime
#  start              :datetime
#  over               :datetime
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  user_id            :integer
#  participants_count :integer          default(0)
#

class Event < ApplicationRecord
  resourcify

  # scope
  scope :running, -> { where('start < :now and over > :now', now: DateTime.now) }
  scope :sign_up_expired, -> { where('sign_up_end < :now', now: DateTime.now) }
  scope :in_registration_time, -> { where('sign_up_end >= :now and sign_up_begin <= :now', now: DateTime.now) }
  scope :closed, -> { where('over < :now', now: DateTime.now) }

  # relation

  belongs_to :organizer, class_name: 'User', foreign_key: :user_id
  has_many :event_users
  has_many :participants, through: :event_users, source: :user, dependent: :destroy

  # valid

  validates_presence_of :name, :max_sign_up_number, :sign_up_begin, :sign_up_end, :start, :over
  validate :myValid

  # method

  def is_full?
    participants_count >= max_sign_up_number
  end

  def in_registration_time?
    now = DateTime.now.to_i
    (sign_up_begin.to_i <= now && now <= sign_up_end.to_i)
  end

  def is_expired?
    sign_up_end.to_i < DateTime.now.to_i
  end

  def can_be_join?
    in_registration_time? && !is_full?
  end

  def join_by(user)
    if !participants.include?(user)
      participants << user
      puts "user #{user.id} joins event #{id} success"
      true
    else
      puts "user #{user.id} had joined event #{id} already"
      false
    end
  end

  def quit_by(user)
    if participants.include?(user)
      participants.destroy(user)
      puts "user #{user.id} quits event #{id} success"
      true
    else
      puts "user #{user.id} has never joined event #{id},so can't quit the event"
      false
    end
  end

  private

  def myValid
    if max_sign_up_number.to_i < min_sign_up_number.to_i
      errors[:max_sign_up_number] << '報名活動的人數上限要比活動成立的人數高吧!'
    end
    if sign_up_begin.to_i >= sign_up_end.to_i
      errors[:sign_up_end] << '結束報名的時間要比開始報名的時間後面喔!'
    end
    errors[:start] << '活動開始的時間要比活動結束的時間還前面吧!' if start.to_i >= over.to_i
    errors[:over] << '報名截止的時間要在活動結束的時間之前喔!' if sign_up_end.to_i >= over.to_i
  end
end
