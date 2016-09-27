class PagesController < ApplicationController
  def index
    @announcements = Announcement.all
    @events = Event.all
  end

  def history
  end

  def news
  end

  def media
  end

  def fellowship
  end

  def weekly
  end
end
