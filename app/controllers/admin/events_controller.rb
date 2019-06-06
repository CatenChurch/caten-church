class Admin::EventsController < Admin::BaseController
  before_action :set_event, only: %i[show edit update destroy download]

  def index
    @q = Event.ransack(params[:q])
    events = case params[:status]
             when 'running'
               @q.result(distinct: true).running
             when 'registration'
               @q.result(distinct: true).in_registration_time
             when 'closed'
               @q.result(distinct: true).closed
             else
               @q.result(distinct: true)
             end
    @events = events.order(id: :desc).page(params[:page])
  end

  def show; end

  def new
    @event = Event.new
  end

  def edit; end

  def create
    @event = current_user.events.build(resource_params)
    if @event.save
      redirect_to admin_event_path(@event)
      flash[:notice] = '建立活動成功'
    else
      flash[:alert] = '建立活動失敗'
      render :new
    end
  end

  def update
    if @event.update(resource_params)
      redirect_to admin_event_path(@event)
      flash[:notice] = '更新活動成功'
    else
      flash[:alert] = '更新活動失敗'
      render :edit
    end
  end

  def destroy
    @event.destroy
    redirect_to admin_events_url
    flash[:alert] = '刪除活動成功'
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
    params.require(:event).permit(
      :name,
      :nature,
      :description,
      :max_sign_up_number,
      :min_sign_up_number,
      :sign_up_begin,
      :sign_up_end,
      :start,
      :over,
      :check_arrival,
      :registery_fee,
      :show_participants
    )
  end
end
