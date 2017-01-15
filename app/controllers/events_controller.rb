class EventsController < ApplicationController
	authorize_resource # cancancan
	before_action :find_event, only:[:show, :join, :quit, :show_participants]

	def index
		@events = Event.all.order(id: :desc)
	end

	def show
	end

	def join
		if current_user.profile.nil?
			flash[:notice] = "填寫個人資料後再來報名活動"
			redirect_to new_account_profile_path
		elsif @event.can_join_event?
			current_user.join_event(@event)
			flash[:notice] = "報名本活動成功"
			redirect_to event_path(@event)
		else
			flash[:warning] = "不在報名期限內或人數已滿"
			redirect_to event_path(@event)
		end
	end

	def quit
		if current_user.is_participant_of_event?(@event) && @event.can_join_event?
			current_user.quit_event(@event)
			flash[:alert] = "已取消報名此活動"
			redirect_to event_path(@event)
		else
			flash[:warning] = "報名截止，無法取消報名"
			redirect_to event_path(@event)
		end
	end

	def show_participants
		# n+1 queries 修正
		@participants = @event.participants.includes(:profile).order(:id)
	end

	private
	def find_event
		@event = Event.find(params[:id])
	end

end
