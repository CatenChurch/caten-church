class Admin::MembersController < Admin::BaseController
  before_action :set_member, only: [:show, :become_admin, :cancel_admin]

  def index
    @q = User.ransack(params[:q])
    @members = @q.result(distinct: true).includes(:profile).order(:id).page(params[:page])

    respond_to do |format|
      format.html
      format.json
    end
  end

  def show; end

  def download
    @members = User.all.includes(:profile).order(:id).page(params[:page])
    render xlsx: 'download', filename: '茄典教會會員一覽.xlsx', disposition: 'inline'
  end

  def become_admin
    @member.become_admin
    flash[:success] = "#{@member.email} 已經成為管理員了。"
    redirect_to :back
  end

  def cancel_admin
    @member.cancel_admin
    flash[:success] = "#{@member.email} 已經不是管理員了。"
    redirect_to :back
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_member
    @member = User.find(params[:id])
  end
end
