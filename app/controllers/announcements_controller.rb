class AnnouncementsController < ApplicationController

  def index
    @announcements = Announcement.all.order(id: :desc).page(params[:page])
  end

  def show
    @announcement = Announcement.find(params[:id])
  end
  
end
