Rails.application.routes.draw do

  resources :announcements, only: [:index,:show]

  resources :events, only: [:index, :show] do

    member do
      post 'join'
      post 'quit'
      get 'show_participants'
    end

  end

  get 'index', 'history', 'news', 'media', 'fellowship', 'weekly', 'youtube', controller: 'pages'

  # devise 註冊後custom導向
  devise_for :users, controllers: { registrations: "users/registrations", omniauth_callbacks: "users/omniauth_callbacks" }

  namespace :admin do

    get '/' => 'pages#index'

    resources :announcements

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
    get 'profile' => 'profile#show'
    get 'profile/new' => 'profile#new'
    post 'profile/new' => 'profile#create'
    get 'profile/edit' => 'profile#edit'
    get 'profile/term' => 'profile#term'
    match 'profile/edit' => 'profile#update', via: [:put, :patch]

    resources :events, only: [:index]
  end

  # 首頁
  root 'pages#index'

end


Rails.application.routes.draw do

  resources :announcements, only: [:index,:show]

  resources :events, only: [:index, :show] do

    member do
      post 'join'
      post 'quit'
      get 'show_participants'
    end

  end

  get 'index', 'history', 'news', 'media', 'fellowship', 'weekly', 'youtube', controller: 'pages'

  # devise 註冊後custom導向
  devise_for :users, controllers: { registrations: "users/registrations", omniauth_callbacks: "users/omniauth_callbacks" }

  namespace :admin do

    get '/' => 'pages#index'

    resources :announcements

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
    get 'profile' => 'profile#show'
    get 'profile/new' => 'profile#new'
    post 'profile/new' => 'profile#create'
    get 'profile/edit' => 'profile#edit'
    get 'profile/term' => 'profile#term'
    match 'profile/edit' => 'profile#update', via: [:put, :patch]

    resources :events, only: [:index]
  end

  # 首頁
  root 'pages#index'

end
