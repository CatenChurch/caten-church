class AnnouncementsController < ApplicationController
  skip_authorization_check

  def index
    @announcements = Announcement.all
  end

  def show
    @announcement = Announcement.find(params[:id])
  end
  
end
