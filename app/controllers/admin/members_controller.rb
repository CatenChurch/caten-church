class Admin::MembersController < Admin::BaseController
  before_action :set_member, only: [:show]

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

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_member
    @member = User.find(params[:id])
  end
end
