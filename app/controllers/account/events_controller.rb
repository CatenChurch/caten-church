class Account::EventsController < Account::BaseController
	def index
		@events = current_user.participated_events.order(start: :desc)
	end
end
