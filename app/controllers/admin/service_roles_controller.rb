class Admin::Service::RolesController < Admin::BaseController
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
      flash[:notice] = '成功建立服事角色'
      redirect_to admin_service_roles_url
    else
      flash[:alert] = '建立服事角色失敗'
      render :new
    end
  end

  def edit; end

  def update
    if @role.update(role_params)
      flash[:notice] = '成功更新服事角色'
      redirect_to admin_service_roles_url
    else
      flash[:alert] = '更新服事角色失敗'
      render :edit
    end
  end

  def destroy
    if @role.destroy
      flash[:notice] = '成功刪除服事角色'
    else
      flash[:alert] = '刪除服事角色失敗'
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
