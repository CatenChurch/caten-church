class Admin::ServiceRolesController < Admin::BaseController
  before_action :find_role, only: %i[show edit update destroy]

  def index
    @q = Service::Team.find_roles.ransack(params[:q])
    @roles = @q.result(distinct: true).order(:id).page(params[:page])
  end

  def show
    @team_users = Service::TeamUser.where(role: @role).includes(:team, user: :profile).order(:id).page(params[:page])
  end

  def new
    @role = Service::Role.new
  end

  def create
    @role = Service::Role.new(role_params)
    @role.resource_type = 'Service::Team'
    if @role.save
      flash[:notice] = t('.success')
      redirect_to admin_service_roles_url
    else
      flash[:alert] = t('.failed')
      render :new
    end
  end

  def edit; end

  def update
    if @role.update(role_params)
      flash[:notice] = t('.success')
      redirect_to admin_service_roles_url
    else
      flash[:alert] = t('.failed')
      render :edit
    end
  end

  def destroy
    if @role.destroy
      flash[:notice] = t('.success')
    else
      flash[:alert] = t('.failed')
    end
    redirect_to admin_service_roles_url
  end

  private

  def role_params
    params.require(:service_role).permit(:name)
  end

  def find_role
    @role = Service::Role.find params[:id]
  end
end
