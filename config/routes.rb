Rails.application.routes.draw do
  # facebook messenger
  get 'messengers/webhook' => 'messengers#verification'
  post 'messengers/webhook' => 'messengers#webhook'
  # sidekiq
  require 'sidekiq/web'
  authenticate :user, ->(u) { Ability.new(u).can?(:manage, :admin) } do
    mount Sidekiq::Web => 'admin/sidekiq'
  end

  resources :contacts, only: [:create]
  resources :announcements, only: [:index, :show]
  resources :events, only: [:index, :show] do
    member do
      post 'join'
      post 'quit'
      get 'participants'
    end
  end
  get 'index', 'youtube', 'term', 'about', 'contact', controller: 'pages'
  # google site verification
  get 'google9107c43bb8511ce3' => 'pages#google_site_verification'

  namespace :account do
    resource :profile, except: [:destroy]
    resources :events, only: [:index]
    # get 'dashboard', controller: 'pages'
  end
  # devise 註冊後custom導向
  devise_for :users, controllers: {
    registrations: 'users/registrations',
    omniauth_callbacks: 'users/omniauth_callbacks',
    confirmations: 'users/confirmations'
  }
  devise_scope :user do
    delete 'users/unconfirmed_email' => 'users/confirmations#cancel', as: :user_unconfirmed_email
  end

  namespace :admin do
    get '/' => 'pages#index'
    resources :service_teams
    resources :service_roles
    resources :service_schedules, except: [:show]
    resources :contacts, except: [:new, :create] do
      member do
        post 'handle'
      end
    end
    resources :announcements do
      member do
        post 'post_to_facebook'
      end
    end
    resources :members, only: [:index, :show, :edit, :update] do
      get 'download', on: :collection
      member do
        post 'become_admin'
        post 'cancel_admin'
      end
    end
    resources :events do
      member do
        get 'download'
      end
      resource :event_users, path: :users
    end
  end

  # 首頁
  root 'pages#index'
end
