class Admin::AnnouncementsController < AdminController
  before_action :set_announcement, only: [:show, :edit, :update, :destroy]

  def index
    @announcements = Announcement.all.order(id: :desc)
  end

  def show
  end

  def new
    @announcement = Announcement.new
  end

  def edit
  end

  def create
    @announcement = current_user.announcements.new(resource_params)

    if @announcement.save
      redirect_to admin_announcement_path(@announcement), notice: 'Announcement was successfully created.'
    else
      render :new
    end
  end

  def update
    if @announcement.update(resource_params)
      redirect_to admin_announcement_path(@announcement), notice: 'Announcement was successfully updated.'
    else
      render :edit
    end
  end

  def destroy
    @announcement.destroy
    redirect_to admin_announcements_path, notice: 'Announcement was successfully destroyed.'
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_announcement
      @announcement = Announcement.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def resource_params
      params.require(:announcement).permit(:title, :description, :content)
    end
end
