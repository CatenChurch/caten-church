# == Route Map
#
#                   Prefix Verb      URI Pattern                             Controller#Action
#            announcements GET       /announcements(.:format)                announcements#index
#             announcement GET       /announcements/:id(.:format)            announcements#show
#               join_event POST      /events/:id/join(.:format)              events#join
#               quit_event POST      /events/:id/quit(.:format)              events#quit
#          show_list_event GET       /events/:id/show_list(.:format)         events#show_list
#                   events GET       /events(.:format)                       events#index
#                    event GET       /events/:id(.:format)                   events#show
#                    index GET       /index(.:format)                        pages#index
#                  history GET       /history(.:format)                      pages#history
#                     news GET       /news(.:format)                         pages#news
#                    media GET       /media(.:format)                        pages#media
#               fellowship GET       /fellowship(.:format)                   pages#fellowship
#                   weekly GET       /weekly(.:format)                       pages#weekly
#                  youtube GET       /youtube(.:format)                      pages#youtube
#         new_user_session GET       /users/sign_in(.:format)                devise/sessions#new
#             user_session POST      /users/sign_in(.:format)                devise/sessions#create
#     destroy_user_session DELETE    /users/sign_out(.:format)               devise/sessions#destroy
#            user_password POST      /users/password(.:format)               devise/passwords#create
#        new_user_password GET       /users/password/new(.:format)           devise/passwords#new
#       edit_user_password GET       /users/password/edit(.:format)          devise/passwords#edit
#                          PATCH     /users/password(.:format)               devise/passwords#update
#                          PUT       /users/password(.:format)               devise/passwords#update
# cancel_user_registration GET       /users/cancel(.:format)                 registrations#cancel
#        user_registration POST      /users(.:format)                        registrations#create
#    new_user_registration GET       /users/sign_up(.:format)                registrations#new
#   edit_user_registration GET       /users/edit(.:format)                   registrations#edit
#                          PATCH     /users(.:format)                        registrations#update
#                          PUT       /users(.:format)                        registrations#update
#                          DELETE    /users(.:format)                        registrations#destroy
#                    admin GET       /admin(.:format)                        admin/pages#index
#      admin_announcements GET       /admin/announcements(.:format)          admin/announcements#index
#                          POST      /admin/announcements(.:format)          admin/announcements#create
#   new_admin_announcement GET       /admin/announcements/new(.:format)      admin/announcements#new
#  edit_admin_announcement GET       /admin/announcements/:id/edit(.:format) admin/announcements#edit
#       admin_announcement GET       /admin/announcements/:id(.:format)      admin/announcements#show
#                          PATCH     /admin/announcements/:id(.:format)      admin/announcements#update
#                          PUT       /admin/announcements/:id(.:format)      admin/announcements#update
#                          DELETE    /admin/announcements/:id(.:format)      admin/announcements#destroy
#   download_admin_members GET       /admin/members/download(.:format)       admin/members#download
#            admin_members GET       /admin/members(.:format)                admin/members#index
#             admin_member GET       /admin/members/:id(.:format)            admin/members#show
#    show_list_admin_event GET       /admin/events/:id/show_list(.:format)   admin/events#show_list
#     download_admin_event GET       /admin/events/:id/download(.:format)    admin/events#download
#             admin_events GET       /admin/events(.:format)                 admin/events#index
#                          POST      /admin/events(.:format)                 admin/events#create
#          new_admin_event GET       /admin/events/new(.:format)             admin/events#new
#         edit_admin_event GET       /admin/events/:id/edit(.:format)        admin/events#edit
#              admin_event GET       /admin/events/:id(.:format)             admin/events#show
#                          PATCH     /admin/events/:id(.:format)             admin/events#update
#                          PUT       /admin/events/:id(.:format)             admin/events#update
#                          DELETE    /admin/events/:id(.:format)             admin/events#destroy
#           account_groups GET       /account/groups(.:format)               account/groups#index
#            account_posts GET       /account/posts(.:format)                account/posts#index
#          account_profile GET       /account/profile(.:format)              account/profile#show
#      account_profile_new GET       /account/profile/new(.:format)          account/profile#new
#                          POST      /account/profile/new(.:format)          account/profile#create
#     account_profile_edit GET       /account/profile/edit(.:format)         account/profile#edit
#     account_profile_term GET       /account/profile/term(.:format)         account/profile#term
#                          PUT|PATCH /account/profile/edit(.:format)         account/profile#update
#           account_events GET       /account/events(.:format)               account/events#index
#                     root GET       /                                       pages#index
#

Rails.application.routes.draw do

  resources :announcements, only: [:index,:show]

  resources :events, only: [:index, :show] do

    member do
      post 'join'
      post 'quit'
      get 'show_list'
    end

  end

  get 'index', 'history', 'news', 'media', 'fellowship', 'weekly', 'youtube', controller: 'pages'

  # devise 註冊後custom導向
  devise_for :users, controllers: { registrations: "registrations" }

  namespace :admin do

    get '/' => 'pages#index'

    resources :announcements

    resources :members, only: [:index,:show] do
      get 'download', on: :collection
    end

    resources :events do

      member do
        get 'show_list'
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
