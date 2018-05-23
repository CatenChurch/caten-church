class User < ApplicationRecord
  rolify

  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable, :confirmable,
         :recoverable, :rememberable, :trackable, :validatable,
         :omniauthable, omniauth_providers: [:facebook]

  has_one :profile, dependent: :destroy
  has_one :subscription, dependent: :destroy
  has_many :announcements
  has_many :events, dependent: :nullify
  has_many :event_users, dependent: :destroy
  has_many :participated_events, through: :event_users, source: :event
  has_many :oauths, dependent: :destroy
  has_one :facebook_oauth, -> { where(provider: 'facebook') }, class_name: 'Oauth'
  has_many :messengers, dependent: :destroy
  has_one :facebook_messenger, -> { where(provider: 'facebook') }, class_name: 'Messenger'
  has_many :service_teams, class_name: 'Service::Team'
  has_many :service_team_user, class_name: 'Service::TeamUser'
  has_many :serviced_teams, through: :service_team_user, source: :team, class_name: 'Service::Team'
  has_many :created_groups, class_name: 'Group', foreign_key: :creater_id, dependent: :nullify
  has_many :group_users, dependent: :destroy
  has_many :joind_groups, through: :group_users, source: :group

  after_create do
    create_subscription!
  end

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
  # def send_devise_notification(notification, *args)
  #   devise_mailer.send(notification, self, *args).deliver_later
  # end

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

  def become_admin
    add_role :admin
  end

  def cancel_admin
    remove_role :admin
  end

  def regenerate_auth_token
    token = generate_unique_secure_token
    loop do
      break token unless User.exists?(auth_token: token)
      token = generate_unique_secure_token
    end
    update! auth_token: token, auth_token_sent_at: Time.now
  end

  private

  def generate_unique_secure_token
    SecureRandom.base58(24)
  end

end
