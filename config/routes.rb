Rails.application.routes.draw do
  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
  root 'pages#index'
  resources :contacts, only: [:create]
  resources :announcements, only: %i[index show]
  resources :events, only: %i[index show] do
    member do
      post 'join'
      post 'quit'
      get 'participants'
    end
  end
  get 'index', 'term', 'about', 'contact', controller: 'pages'
  namespace :account do
    resource :profile, except: [:destroy]
    resource :subscription, only: [:show, :edit, :update]
    resources :messengers, only: [:update]
    resources :events, only: [:index]
  end
  # custom devise controllers
  devise_for :users, controllers: {
    registrations: 'users/registrations',
    omniauth_callbacks: 'users/omniauth_callbacks',
    confirmations: 'users/confirmations'
  }
  devise_scope :user do
    delete 'users/unconfirmed_email' => 'users/confirmations#cancel', as: :user_unconfirmed_email
    get 'users/oauth_sign_up' => 'users/registrations#oauth_new', as: :new_oauth_user_registration
    post 'users/oauth_sign_up' => 'users/registrations#oauth_create', as: :oauth_user_registration
  end
  # google site verification
  get 'google9107c43bb8511ce3' => 'pages#google_site_verification'

  namespace :admin do
    get '/' => 'pages#index'
    resources :groups
    resources :service_teams
    resources :service_roles
    resources :service_schedules, except: [:show]
    resources :contacts, except: %i[new create] do
      member do
        post 'handle'
      end
    end
    resources :announcements do
      member do
        post 'post_to_facebook'
      end
    end
    resources :members, only: %i[index show edit update] do
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
  # sidekiq
  require 'sidekiq/web'
  authenticate :user, ->(u) { Ability.new(u).can?(:manage, :admin) } do
    mount Sidekiq::Web => 'admin/sidekiq'
  end

  # chatbot
  namespace :chatbot do
    post 'line/callback' => 'lines#callback'
    get 'messenger/callback' => 'messengers#verify'
    post 'messenger/callback' => 'messengers#callback'
  end
end
