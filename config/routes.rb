Rails.application.routes.draw do

  resources :announcements, only: [:index,:show]

  resources :events, only: [:index, :show] do

    member do
      post 'join'
      post 'quit'
      get 'show_participants'
    end

  end

  get 'index', 'history', 'news', 'media', 'fellowship', 'weekly', 'youtube','term', controller: 'pages'

  # devise 註冊後custom導向
  devise_for :users, controllers: { registrations: "users/registrations", omniauth_callbacks: "users/omniauth_callbacks" }

  namespace :admin do

    get '/' => 'pages#index'

    resources :announcements do
      member do
        post 'post_to_facebook'
      end
    end

    resources :members, only: [:index,:show] do
      get 'download', on: :collection
    end

    resources :events do

      member do
        get 'show_participants'
        get 'download'
      end

    end

  end

  namespace :account do

    resource :profile, except: [:destroy]

    resources :events, only: [:index]
  end

  # 首頁
  root 'pages#index'

end
