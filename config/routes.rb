# frozen_string_literal: true

Rails.application.routes.draw do
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
  root 'pages#index'
  get 'index', 'term', 'about', 'contact', controller: 'pages'
  get 'google9107c43bb8511ce3' => 'pages#google_site_verification' # google site verification
  resources :contacts, only: %i[create]
  resources :groups, only: %i[index show]
  resources :group_reports, only: %i[index show new create]
  resources :weeklies, only: %i[index show] do
    get :latest, on: :collection
  end
  resources :announcements, only: %i[index show]
  resources :events, only: %i[index show] do
    member do
      post 'join'
      post 'quit'
      get 'participants'
    end
  end
  # Custom devise controllers
  devise_for :users,
             controllers: {
               registrations: 'users/registrations', omniauth_callbacks: 'users/omniauth_callbacks', confirmations: 'users/confirmations'
             }
  devise_scope :user do
    delete 'users/unconfirmed_email' => 'users/confirmations#cancel', as: :user_unconfirmed_email
    get 'users/oauth_sign_up' => 'users/registrations#oauth_new', as: :new_oauth_user_registration
    post 'users/oauth_sign_up' => 'users/registrations#oauth_create', as: :oauth_user_registration
  end

  # For /account
  namespace :account do
    resource :profile, except: %i[destroy]
    resource :subscription, only: %i[show edit update]
    resources :messengers, only: %i[update]
    resources :events, only: %i[index]
  end

  # For /admin
  namespace :admin do
    get '/' => 'pages#index'
    resources :weeklies
    resources :groups
    resources :service_teams
    resources :service_roles
    resources :service_schedules, except: %i[show]
    resources :contacts, except: %i[new create] do
      member { post 'handle' }
    end
    resources :announcements do
      member { post 'post_to_facebook' }
    end
    resources :members, only: %i[index show edit update] do
      get 'download', on: :collection
      member do
        post 'become_admin'
        post 'cancel_admin'
      end
    end
    resources :events do
      member { get 'download' }
      resource :event_users, path: :users
    end
  end

  # Sidekiq
  require 'sidekiq/web'
  authenticate :user, ->(u) { Ability.new(u).can?(:manage, :admin) } do
    mount Sidekiq::Web => 'admin/sidekiq'
  end

  # Chatbot
  namespace :chatbot do
    post 'line/callback' => 'lines#callback'
    get 'messenger/callback' => 'messengers#verify'
    post 'messenger/callback' => 'messengers#callback'
  end
end
