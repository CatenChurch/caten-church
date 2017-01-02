require 'net/http'
class PagesController < ApplicationController
  skip_authorization_check # 不需要cancancan授權
  def index
    @announcements = Announcement.all.order(id: :desc)
    @events = Event.all.order(id: :desc)
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

  def youtube
    # Google Api Key
    api_key = "AIzaSyDHEfUPJKIZBKR8WEWxYmBYRrDSJSKOup4"
    # YouTube https://www.youtube.com/channel/UC-MvdM-JEdQUsT5h7Ratc2w
    @channel_id = "UC-MvdM-JEdQUsT5h7Ratc2w"
    @res = get_res(api_key,@channel_id)
    respond_to do |format|
      format.html
      format.json 
    end
  end

  private

  def get_res(api_key,channel_id)
    api_url = URI("https://www.googleapis.com/youtube/v3/search?key=#{api_key}&channelId=#{channel_id}&part=snippet,id&order=date&maxResults=50")
    res = Net::HTTP.get_response(api_url)
    encode = res['content-type'].split('=').last
    res_body = res.body.force_encoding(encode)
    JSON.parse(res_body)
  end
end
