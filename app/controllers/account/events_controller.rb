class Account::EventsController < AccountController
	def index
		@events = current_user.participated_events.order(start: :desc)
	end
end
