json.id @channel_id
json.title @res['items'][0]['snippet']['channelTitle']
json.url "https://www.youtube.com/channel/#{@channel_id}"
json.videos @res['items'] do |video|
  if video['id']['kind'] == "youtube#video"
    json.id video['id']['videoId']
    json.title video['snippet']['title']
    json.description video['snippet']['description']
    json.published_at video['snippet']['publishedAt']
    json.url "https://www.youtube.com/watch?v=#{video['id']['videoId']}"
    json.embed_url "https://www.youtube.com/embed/#{video['id']['videoId']}"
  end
end