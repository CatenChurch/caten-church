class Admin::ServiceRolesController < Admin::BaseController
  before_action :find_role, only: [:show, :edit, :update, :destroy]

  def index
    @q = Service::Team.find_roles.ransack(params[:q])
    @roles = @q.result(distinct: true).order(:id).page(params[:page])
  end

  def show
    @team_users = Service::TeamUser.where(role: @role).includes(:team, user: :profile).order(:id).page(params[:page])
  end

  def new
    @role = Role.new
  end

  def create
    @role = Role.new(role_params)
    @role.resource_type = 'Service::Team'
    if @role.save
      flash[:success] = t('service_role.created')
      redirect_to admin_service_roles_url
    else
      flash[:danger] = t('service_role.create_failed')
      render :new
    end
  end

  def edit; end

  def update
    if @role.update(role_params)
      flash[:success] = t('service_role.updated')
      redirect_to admin_service_roles_url
    else
      flash[:danger] = t('service_role.update_failed')
      render :edit
    end
  end

  def destroy
    if @role.destroy
      flash[:warning] = t('service_role.destroyed')
    else
      flash[:danger] = t('service_role.destroy_failed')
    end
    redirect_to admin_service_roles_url
  end

  private
  def role_params
    params.require(:role).permit(:name)
  end

  def find_role
    @role = Role.find params[:id]
  end
end
