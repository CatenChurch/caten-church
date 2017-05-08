class Admin::MembersController < AdminController
  before_action :set_member, only: [:show]
  before_action :set_members, only: [:index, :download]

  def index; end

  def show; end

  def download
    render xlsx: 'download', filename: '茄典教會會員一覽.xlsx', disposition: 'inline'
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_member
    @member = User.find(params[:id])
  end

  def set_members
    @members = User.all.includes(:profile).order(:id).page(params[:page])
  end
end
