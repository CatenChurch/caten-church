Rails.application.routes.draw do
  resources :contacts, only: [:create]
  resources :announcements, only: [:index, :show]

  resources :events, only: [:index, :show] do
    member do
      post 'join'
      post 'quit'
      get 'participants'
    end
  end

  get 'index', 'info', 'history', 'youtube', 'term', 'about', 'contact', controller: 'pages'
  # google site verification
  get 'google9107c43bb8511ce3' => 'pages#google_site_verification'

  # devise 註冊後custom導向
  devise_for :users, controllers: { registrations: 'users/registrations', omniauth_callbacks: 'users/omniauth_callbacks' }

  namespace :admin do
    get '/' => 'pages#index'

    resources :contacts, except: [:new, :create]
    
    resources :announcements do
      member do
        post 'post_to_facebook'
      end
    end

    resources :members, only: [:index, :show, :edit, :update] do
      get 'download', on: :collection
    end

    resources :events do
      member do
        get 'download'
      end
      resource :event_users, path: :users
    end
  end

  namespace :account do
    resource :profile, except: [:destroy]
    resources :events, only: [:index]
    # get 'dashboard', controller: 'pages'
  end

  # 首頁
  root 'pages#index'
end
