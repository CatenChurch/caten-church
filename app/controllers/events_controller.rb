class EventsController < ApplicationController
	load_and_authorize_resource # cancancan
	before_action :authenticate_user!, only:[:join, :quit, :show_list]
	before_action :find_event, only:[:show, :join, :quit, :show_list]

	def index
		@events = Event.all
	end

	def show
	end

	def join
		if current_user.profile.nil?
			flash[:notice] = "填寫個人資料後再來報名活動"
			redirect_to account_profile_new_path
		elsif @event.can_join_event?
			current_user.join_event(@event)
			# add role 'participant'
			current_user.add_role :participant, Event.find(@event.id)
			flash[:notice] = "報名本活動成功"
			redirect_to event_path(@event)
		else
			flash[:warning] = "不在報名期限內或人數已滿"	
			redirect_to event_path(@event)
		end	
	end

	def quit
		if current_user.is_participant_of_event?(@event)
			# remove role 'participant'
			current_user.remove_role :participant, Event.find(@event.id)
			current_user.quit_event(@event)
			flash[:alert] = "已取消報名此活動"
			redirect_to event_path(@event)
		else
			flash[:warning] = "你還沒報名參加活動呢"
			redirect_to event_path(@event)
		end
	end

	def show_list
		# n+1 queries 修正
		@participants = @event.participants.includes(:profile)
	end

	
	
	private
	def find_event
		@event = Event.find(params[:id])
	end

	def event_params
		params.require(:event).permit(:name, :nature, :description, :max_sign_up_number, :min_sign_up_number, :sign_up_begin, :sign_up_end, :start, :over)
	end

	
end