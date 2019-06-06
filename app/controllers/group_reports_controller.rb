class GroupReportsController < ApplicationController
  before_action :set_report, only: [:show]
  before_action :set_lead_groups, only: %i[new create]
  before_action :check_is_leader, only: %i[new create]

  def index
    @groups = Group.all.includes(:prev_week_report, :current_week_report, leader: :profile).order(:sequence)
  end

  def show; end

  def new
    default_params = {}
    if @group_id
      default_params[:group] = @lead_groups[0]
      default_params[:meeting_time] = @lead_groups[0].prev_week_report&.next_meeting_time
      default_params[:meeting_place] = @lead_groups[0].prev_week_report&.next_meeting_place
      default_params[:next_meeting_time] = (@lead_groups[0].prev_week_report&.next_meeting_time || Time.now) + 7.days
      default_params[:next_meeting_place] = @lead_groups[0].prev_week_report&.next_meeting_place
    end
    @report = GroupReport.new default_params
  end

  def create
    @report = current_user.created_group_reports.build(report_params)

    if @report.save
      flash[:notice] = '成功建立小組回報'
      redirect_to group_report_url(@report)
    else
      flash[:alert] = '建立小組回報時發生錯誤'
      render :new
    end
  end

  private

  def set_report
    @report = GroupReport.find(params[:id])
  end

  def set_lead_groups
    @group_id = params.dig(:group_report, :group_id)&.to_i
    @lead_groups = (@group_id ? current_user.lead_groups.where(id: @group_id) : current_user.lead_groups)
  end

  def check_is_leader
    return if @lead_groups.present?

    redirect_to group_reports_url, alert: '你不是小組長'
  end

  def report_params
    params.require(:group_report).permit(:adults_count, :children_count, :dedication, :meeting_time, :meeting_place, :next_meeting_time, :next_meeting_place, :group_id)
  end
end
