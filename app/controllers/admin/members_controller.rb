# frozen_string_literal: true

class Admin::MembersController < Admin::BaseController
  before_action :set_member, only: %i[show become_admin cancel_admin]

  def index
    @q = User.ransack(params[:q])
    @members = @q.result(distinct: true).includes(:profile).order(:id).page(params[:page])

    respond_to do |format|
      format.html
      format.json # FIXME: api dont need paginate
    end
  end

  def show
    @events = @member.participated_events.order(id: :desc)
  end

  def download
    @members = User.all.includes(:profile).order(:id)
    render xlsx: 'download', filename: '茄典教會會員一覽.xlsx', disposition: 'inline'
  end

  def become_admin
    @member.become_admin
    flash[:notice] = "#{@member.email} 已成為管理員"
    redirect_back fallback_location: admin_members_url
  end

  def cancel_admin
    @member.cancel_admin
    flash[:notice] = "#{@member.email} 已不是管理員"
    redirect_back fallback_location: admin_members_url
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_member
    @member = User.find(params[:id])
  end
end
