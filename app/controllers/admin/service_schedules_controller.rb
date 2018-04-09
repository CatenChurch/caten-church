class Admin::ServiceSchedulesController < Admin::BaseController
  before_action :find_schedule, only: [:edit, :update, :destroy]

  def index
    @q = Service::Schedule.ransack(params[:q])
    @schedules = @q.result(distinct: true).includes(:team).order(service_time: :desc).page(params[:page])
  end

  def new
    @schedule = Service::Schedule.new(service_time: Time.now)
  end

  def create
    @schedule = Service::Schedule.new(schedule_params)
    if @schedule.save
      flash[:notice] = t('.success')
      redirect_to admin_service_schedules_url
    else
      flash[:alert] = t('.failed')
      render :new
    end
  end

  def edit; end

  def update
    if @schedule.update(schedule_params)
      flash[:notice] = t('.success')
      redirect_to admin_service_schedules_url
    else
      flash[:alert] = t('.failed')
      render :edit
    end
  end

  def destroy
    if @schedule.destroy
      flash[:notice] = t('.success')
    else
      flash[:alert] = t('.failed')
    end
    redirect_to admin_service_schedules_url
  end

  private
  def schedule_params
    params.require(:service_schedule).permit(:service_team_id, :service_time)
  end

  def find_schedule
    @schedule = Service::Schedule.find params[:id]
  end
end
