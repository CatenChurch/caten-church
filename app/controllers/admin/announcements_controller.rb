class Admin::AnnouncementsController < AdminController
  load_and_authorize_resource
  before_action :set_admin_announcement, only: [:show, :edit, :update, :destroy]

  # GET /admin/announcements
  # GET /admin/announcements.json
  def index
    @admin_announcements = Admin::Announcement.all
  end

  # GET /admin/announcements/1
  # GET /admin/announcements/1.json
  def show
  end

  # GET /admin/announcements/new
  def new
    @admin_announcement = Admin::Announcement.new
  end

  # GET /admin/announcements/1/edit
  def edit
  end

  # POST /admin/announcements
  # POST /admin/announcements.json
  def create
    @admin_announcement = Admin::Announcement.new(resource_params)

    respond_to do |format|
      if @admin_announcement.save
        format.html { redirect_to @admin_announcement, notice: 'Announcement was successfully created.' }
        format.json { render :show, status: :created, location: @admin_announcement }
      else
        format.html { render :new }
        format.json { render json: @admin_announcement.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /admin/announcements/1
  # PATCH/PUT /admin/announcements/1.json
  def update
    respond_to do |format|
      if @admin_announcement.update(resource_params)
        format.html { redirect_to @admin_announcement, notice: 'Announcement was successfully updated.' }
        format.json { render :show, status: :ok, location: @admin_announcement }
      else
        format.html { render :edit }
        format.json { render json: @admin_announcement.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /admin/announcements/1
  # DELETE /admin/announcements/1.json
  def destroy
    @admin_announcement.destroy
    respond_to do |format|
      format.html { redirect_to admin_announcements_url, notice: 'Announcement was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_admin_announcement
      @admin_announcement = Admin::Announcement.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def resource_params
      params.require(:admin_announcement).permit(:title, :description)
    end
end
