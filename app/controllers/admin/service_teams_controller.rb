class Admin::ServiceTeamsController < Admin::BaseController
  before_action :find_team, only: [:show, :update, :destroy]
  before_action :find_roles, only: [:new, :create, :edit, :update]

  def index
    @q = Service::Team.ransack(params[:q])
    @teams = @q.result(distinct: true).includes(leader: :profile).order(:id).page(params[:page])
  end

  def show
    @team_users = Service::TeamUser.where(team: @team).includes(:role, user: :profile).order(:id).page(params[:page]).per(10)
  end

  def new
    @team = Service::Team.new
    @team.team_users.build
  end

  def create
    @team = Service::Team.new(team_params)
    if @team.save
      flash[:notice] = t('.success')
      redirect_to admin_service_teams_url
    else
      flash[:alert] = t('.failed')
      render :new
    end
  end

  def edit
    @team = Service::Team.includes(team_users: [{ user: :profile }]).find(params[:id])
  end

  def update
    if @team.update(team_params)
      flash[:notice] = t('.success')
      redirect_to admin_service_teams_url
    else
      flash[:alert] = t('.failed')
      render :edit
    end
  end

  def destroy
    if @team.destroy
      flash[:notice] = t('.success')
    else
      flash[:alert] = t('.failed')
    end
    redirect_to admin_service_teams_url
  end

  private

  def find_team
    @team = Service::Team.find params[:id]
  end

  def find_roles
    @roles = Service::Role.where(resource_type: 'Service::Team').select(:name, :id)
  end

  def team_params
    params.require(:service_team).permit :name, :user_id, team_users_attributes: [:id, :user_id, :role_id, :_destroy]
  end
end
