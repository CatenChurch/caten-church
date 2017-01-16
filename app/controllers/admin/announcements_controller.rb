class Admin::AnnouncementsController < AdminController
  before_action :set_announcement, only: [:show, :edit, :update, :destroy, :post_to_facebook]

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

  def post_to_facebook
    @graph = Koala::Facebook::API.new(session[:facebook_access_token])
    publish_actions = @graph.get_connections("me","permissions/publish_actions")
    if user_has_facebook_permission?(publish_actions)
      fb_object_id = "244141208966188"
      message = @announcement.content
      # link = "https://www.facebook.com/#{fb_object_id}"
      link = announcement_url(@announcement)
      # post feed
      fb_post = @graph.put_connections(fb_object_id, "feed", message: message, link: link)
      # post photo
      # @graph.put_connections("244141208966188", "photos", url: "", caption: "")
      redirect_to admin_announcement_url(@announcement), notice: "此公告已成功發至FB，前往觀看: https://www.facebook.com/#{fb_post["id"]}"
    else
      redirect_to user_facebook_omniauth_authorize_path(scope: "publish_actions")
    end


  end
  private

  def user_has_facebook_permission?(permission)
    if !permission.blank? && permission.first["status"]=="granted"
      true
    else
      false
    end
  end

  # Use callbacks to share common setup or constraints between actions.
  def set_announcement
    @announcement = Announcement.find(params[:id])
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def resource_params
    params.require(:announcement).permit(:title, :description, :content)
  end
end
