require 'net/http'
class PagesController < ApplicationController
  def index; end

  def about; end

  def contact; end

  def info; end

  def history; end

  def term; end

  def youtube
    # Google Api Key in config/application.yml
    api_key = ENV['GOOGLE_API_KEY']
    # YouTube https://www.youtube.com/channel/UC-MvdM-JEdQUsT5h7Ratc2w
    @channel_id = 'UC-MvdM-JEdQUsT5h7Ratc2w'
    @res = get_res(api_key, @channel_id)
    respond_to do |format|
      format.html
      format.json
    end
  end

  def google_site_verification
    render layout: false
  end

  private

  def get_res(api_key, channel_id)
    api_url = URI("https://www.googleapis.com/youtube/v3/search?key=#{api_key}&channelId=#{channel_id}&part=snippet,id&order=date&maxResults=50")
    res = Net::HTTP.get_response(api_url)
    encode = res['content-type'].split('=').last
    res_body = res.body.force_encoding(encode)
    JSON.parse(res_body)
  end
end
