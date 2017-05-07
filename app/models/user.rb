# == Schema Information
#
# Table name: users
#
#  id                     :integer          not null, primary key
#  email                  :string           default(""), not null
#  encrypted_password     :string           default(""), not null
#  reset_password_token   :string
#  reset_password_sent_at :datetime
#  remember_created_at    :datetime
#  sign_in_count          :integer          default(0), not null
#  current_sign_in_at     :datetime
#  last_sign_in_at        :datetime
#  current_sign_in_ip     :string
#  last_sign_in_ip        :string
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#  provider               :string
#  uid                    :string
#

class User < ApplicationRecord
  # roles
  rolify

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
         :omniauthable, omniauth_providers: [:facebook]

  has_one :profile, dependent: :destroy

  has_many :announcements

  has_many :events
  has_many :event_users
  has_many :participated_events, through: :event_users, source: :event

  has_many :oauths, dependent: :destroy

  # user has profile
  def has_profile?
    !profile.blank?
  end

  # check role is admin
  def is_manager?
    self && has_any_role?(:admin)
  end

  def is_first_time_sign_in?
    sign_in_count <= 1
  end

  def self.email_has_been_used?(email)
    !where(email: email).blank?
  end

  # event
  def join_event(event)
    participated_events << event
  end

  def quit_event(event)
    participated_events.destroy(event)
  end

  def is_participant_of_event?(event)
    participated_events.include?(event)
  end

  # user connect omniauth
  def connect_omniauth(auth)
    oauths << auth
  end
end
