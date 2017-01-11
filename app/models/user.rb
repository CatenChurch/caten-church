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
#  name                   :string
#

class User < ActiveRecord::Base
  # roles
  rolify

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
<<<<<<< HEAD
  :recoverable, :rememberable, :trackable, :validatable,
  :omniauthable, :omniauth_providers => [:facebook]
  # 設定 user 跟 group 之間的資料庫關聯
  has_many :groups
  has_many :posts
  # user has many group_users
  # user has many participated_groups from group, and save in group_user
  has_many :group_users
  has_many :participated_groups, through: :group_users, source: :group
  # 一個 user 有一個 user_profile
=======
  :recoverable, :rememberable, :trackable, :validatable


>>>>>>> refactoring
  has_one :profile, dependent: :destroy

  has_many :announcements

  has_many :events
  has_many :event_users
  has_many :participated_events, through: :event_users, source: :event

  # check role is admin
  def is_manager?
    self && self.has_any_role?(:admin)
  end

  # event
  def join_event(event)
    participated_events << event
  end
  def quit_event(event)
    participated_events.delete(event)
  end
  def is_participant_of_event?(event)
    participated_events.include?(event)
  end
  # omniauth sign up
  def self.from_omniauth(auth)
    where(provider: auth.provider, uid: auth.uid).first_or_create do |user|
      user.email = auth.info.email
      user.password = Devise.friendly_token[0,20]
    end
  end
  # user connect omniauth
  def connect_omniauth

<<<<<<< HEAD
  end



=======
>>>>>>> refactoring
end
