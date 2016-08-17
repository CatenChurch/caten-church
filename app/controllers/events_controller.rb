class EventsController < ApplicationController
	load_and_authorize_resource # cancancan

	before_action :authenticate_user!, only:[:new, :edit, :create, :update, :destroy, :join, :quit, :show_list]
	before_action :find_event, only:[:show, :join, :quit, :show_list, :edit, :update, :destroy ]
	before_action :guest_user, only: [:index, :show]
	def index
		@events = Event.all
		respond_to do |format|
	      	format.html
	      	format.json { render :json => @events }
	    end
	end

	def show
		respond_to do |format|
	      	format.html
	      	format.json { render :json => @event }
	    end
	end

	def new 
		@event = Event.new
	end

	def create
		@event = current_user.events.new(event_params)
		if @event.save

			# add role 'organizer'
			current_user.add_role :organizer, Event.find(@event.id)

			redirect_to events_path
			flash[:success] = "活動發起成功"
		else
			render :new
		end
	end

	def edit
		# cancancan 讓 admin 可以編輯其他人的 event
		# @event = current_user.events.find(params[:id]) 
	end

	def update
		# cancancan 讓 admin 可以編輯其他人的 event
		# @event = current_user.events.find(params[:id])
		 
		if @event.update(event_params)
			redirect_to events_path
			flash[:success] = "活動修改成功"
		else
			render :edit
		end
	end

	def destroy
		# cancancan 讓 admin 可以刪除其他人的 event
		# @event = current_user.events.find(params[:id])

		# remove role 'organizer'
		current_user.remove_role :organizer, Event.find(@event.id)

		@event.destroy
		redirect_to events_path
		flash[:danger] = "活動已刪除"
	end

	def join
		# if @event.participants_count >= @event.max_sign_up_number
		# 	flash[:warning] = "報名人數已達上限"
		# else
		# 	if !current_user.is_participant_of_event?(@event)
		# 		current_user.join_event(@event)
		# 		flash[:notice] = "報名本活動成功"
		# 	else
		# 		flash[:warning] = "你已經報名過這個活動了"
		# 	end
		# end

		if @event.can_join_event?
			current_user.join_event(@event)
			# add role 'participant'
			current_user.add_role :participant, Event.find(@event.id)
			flash[:notice] = "報名本活動成功"
		else
			flash[:warning] = "不在報名期限內或人數已滿"	
		end
		

		redirect_to event_path(@event)
	end

	def quit
		if current_user.is_participant_of_event?(@event)
			current_user.quit_event(@event)
			# remove role 'participant'
			current_user.remove_role :participant, Event.find(@event.id)
			flash[:alert] = "已取消報名此活動"
		else
			flash[:warning] = "你還沒報名參加活動呢"
		end
		redirect_to event_path(@event)
	end

	def show_list
		# n+1 queries 修正
		@participants = @event.participants.includes(:profile)
		respond_to do |format|
		    format.html
		    if current_user.is_manager?
		    	format.json { render :json => @participants.to_json(include: :profile) } 
		    else
		    	format.json { render :json => current_user } 
		    end   	
		end
	end

	def find_event
		@event = Event.find(params[:id])
	end
	
	private

	def event_params
		params.require(:event).permit(:name, :nature, :description, :max_sign_up_number, :min_sign_up_number, :sign_up_begin, :sign_up_end, :start, :over)
	end

	
end