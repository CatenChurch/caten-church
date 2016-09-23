class AnnouncementsController < ApplicationController
  load_and_authorize_resource
  before_action :set_announcement, only: [:show]

  def index
    @announcements = Announcement.all
  end

  def show
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_announcement
      @announcement = Announcement.find(params[:id])
    end
end
