class User < ApplicationRecord
  rolify

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable, :confirmable,
         :recoverable, :rememberable, :trackable, :validatable,
         :omniauthable, omniauth_providers: [:facebook]

  has_one :profile, dependent: :destroy
  has_many :announcements
  has_many :events, dependent: :nullify
  has_many :event_users, dependent: :destroy
  has_many :participated_events, through: :event_users, source: :event
  has_many :oauths, dependent: :destroy
  has_one :facebook_oauth, -> { where(provider: 'facebook') }, class_name: Oauth
  has_many :service_teams, class_name: Service::Team
  has_many :service_team_user, class_name: Service::TeamUser
  has_many :serviced_teams, through: :service_team_user, source: :team, class_name: Service::Team

  # ransackable_scopes https://github.com/activerecord-hackery/ransack#using-scopesclass-methods
  def self.ransackable_scopes(_auth_object = nil)
    [:birth_month]
  end

  def self.birth_month(month = nil)
    return all if month.blank?
    user_ids = Profile.birth_month(month).pluck(:user_id)
    where(id: user_ids)
  end

  # devise 異步發送郵件
  # https://github.com/plataformatec/devise#activejob-integration
  def send_devise_notification(notification, *args)
    devise_mailer.send(notification, self, *args).deliver_later
  end

  # user has profile
  def has_valid_profile?
    profile.present? && profile.valid?
  end

  def first_time_sign_in?
    sign_in_count <= 1
  end

  # event
  def joined?(event)
    EventUser.find_by(user: self, event: event).present?
  end

  def join(event, params = {})
    event_user = EventUser.new(params)
    event_user.user = self
    event_user.event = event
    event_user.save!
  end

  def quit(event)
    event_user = EventUser.find_by(user: self, event: event)
    raise ActiveRecord::RecordNotFound unless event_user
    event_user.destroy
  end

  # user connect omniauth
  def connect_omniauth(auth)
    oauths << auth
  end

  def become_admin
    add_role :admin
  end

  def cancel_admin
    remove_role :admin
  end
end
