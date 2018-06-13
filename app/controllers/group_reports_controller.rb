class GroupReportsController < ApplicationController
  before_action :set_report, only: [:show]
  before_action :check_is_leader, only: [:new, :create]

  def index
    @groups = Group.all.includes(:prev_week_report, :week_report, leader: :profile).order(:id)
  end

  def show; end

  def new
    @report = GroupReport.new
  end

  def create
    @report = current_user.created_group_reports.build(report_params)

    if @report.save
      flash[:notice] = t('.success')
      redirect_to group_report_url(@report)
    else
      flash[:alert] = t('.failed')
      render :new
    end
  end

  private

  def set_report
    @report = GroupReport.find(params[:id])
  end

  def report_params
    params.require(:group_report).permit(:adults_count, :children_count, :dedication, :next_meeting_time, :next_meeting_place, :group_id)
  end

  def check_is_leader
    redirect_to group_reports_url, alert: t('group_reports.check_is_leader.failed')  unless current_user.is_group_leader? 
  end
end
