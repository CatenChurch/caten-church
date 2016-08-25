class Admin::MembersController < AdminController
  load_and_authorize_resource # cancancan
  before_action :set_member, only: [:show, :edit, :update, :destroy]

  def index
    @members = Admin::Member.all.includes(:profile)
    respond_to do |format|
      format.html
      format.json { render :json => @members.to_json(include: :profile) }
    end
  end

  def show
  end


  private
    # Use callbacks to share common setup or constraints between actions.
    def set_member
      @member = Admin::Member.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def resource_params
      params.require().permit()
    end
end
