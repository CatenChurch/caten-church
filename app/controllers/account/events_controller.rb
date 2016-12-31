class Account::EventsController < ApplicationController
  authorize_resource :account
	
	def index
		@events = current_user.participated_events
	end
end
