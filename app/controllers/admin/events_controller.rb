class Admin::EventsController < AdminController
  before_action :set_event, only: [:show, :edit, :update, :destroy, :show_participants, :download]

  def index
    events = Event.all.order(id: :desc)
    @events = []
		@expired_events = []
    events.each do |event|
			if event.is_expired?
				@expired_events << event
			else
				@events << event
			end
		end
  end

  def show

  end

  def new
    @event = Event.new
  end


  def edit
  end


  def create
    @event = current_user.events.new(resource_params)
    if @event.save
      redirect_to admin_event_path(@event)
      flash[:success] = "活動發起成功"
    else
      render :new
    end
  end

  def update
    if @event.update(resource_params)
      redirect_to admin_event_path(@event)
      flash[:success] = "活動修改成功"
    else
      render :edit
    end
  end

  def destroy
    @event.destroy
    redirect_to admin_events_path
    flash[:danger] = "活動已刪除"
  end

  def show_participants
    @participants = @event.participants.includes(:profile).order(:id)
  end

  def download
    @participants = @event.participants.includes(:profile)
    render xlsx: 'download', filename: "#{@event.name}.xlsx", disposition: 'inline'
  end

  private
    def set_event
      @event = Event.find(params[:id])
    end

    def resource_params
      params.require(:event).permit(:name, :nature, :description, :max_sign_up_number, :min_sign_up_number, :sign_up_begin, :sign_up_end, :start, :over)
    end
end
