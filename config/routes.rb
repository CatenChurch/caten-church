Rails.application.routes.draw do
  # devise 註冊後custom導向
  devise_for :users, controllers: { registrations: "registrations" }

  namespace :account do
    # account/groups
    resources :groups, only: [:index]

    # account/posts
    resources :posts, only: [:index]

    # account/profile 
    get 'profile' => 'profile#show'
    get 'profile/new' => 'profile#new'
    post 'profile/new' => 'profile#create'
    get 'profile/edit' => 'profile#edit'
    get 'profile/term' => 'profile#term'
    match 'profile/edit' => 'profile#update', via: [:put, :patch]
    
    # account/events
    resources :events, only: [:index]
  end

  # groups 
  get 'groups/' => 'groups#index'
  resources :groups do
    member do
      post :join
      post :quit
    end
    # posts 的路徑
    resources :posts
  end

  # events
  resources :events do 
    member do 
      post 'join'
      post 'quit'
      get 'show_list'  
    end
  end


  # pages 
  get 'index', 'history', 'news', 'media', 'fellowship', 'weekly', controller: 'pages'
  
  # 首頁
  root 'pages#index'

  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"
  # root 'welcome#index'

  # Example of regular route:
  #   get 'products/:id' => 'catalog#view'

  # Example of named route that can be invoked with purchase_url(id: product.id)
  #   get 'products/:id/purchase' => 'catalog#purchase', as: :purchase

  # Example resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Example resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Example resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Example resource route with more complex sub-resources:
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', on: :collection
  #     end
  #   end

  # Example resource route with concerns:
  #   concern :toggleable do
  #     post 'toggle'
  #   end
  #   resources :posts, concerns: :toggleable
  #   resources :photos, concerns: :toggleable

  # Example resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end
end
