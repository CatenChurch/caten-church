class Admin::GroupsController < Admin::BaseController
  before_action :set_group, only: %i[show edit update destroy]

  def index
    @q = Group.ransack(params[:q])
    @groups = @q.result(distinct: true).includes(leader: :profile).order(:sequence).page(params[:page])
  end

  def show
    @reports = @group.reports.includes(creater: :profile).order(id: :desc).page(params[:page])
  end

  def new
    @group = Group.new
  end

  def edit; end

  def create
    @group = Group.new(group_params)
    @group.creater = current_user
    if @group.save
      @group.change_leader(User.find(leader_params[:id])) if leader_params[:id].present?
      redirect_to admin_group_url(@group), notice: t('.success')
    else
      flash[:alert] = t('.failed')
      render :new
    end
  end

  def update
    if @group.update(group_params)
      @group.change_leader(User.find(leader_params[:id])) if leader_params[:id].present?
      redirect_to admin_group_url(@group), notice: t('.success')
    else
      flash[:alert] = t('.failed')
      render :edit
    end
  end

  def destroy
    @group.destroy
    redirect_to admin_groups_url, notice: t('.success')
  end

  private

  def set_group
    @group = Group.find(params[:id])
  end

  def group_params
    params.slice(:group).require(:group).permit(:name, :introduction, :description, :sequence)
  end

  def leader_params
    params.slice(:leader).require(:leader).permit(:id)
  end
end
