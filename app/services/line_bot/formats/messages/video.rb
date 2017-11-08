class LineBot::Formats::Messages::Video < LineBot::Formats::Message
  attr_accessor :originalContentUrl, :previewImageUrl

  def initialize(originalContentUrl, previewImageUrl)
    @type = 'video'
    @originalContentUrl = originalContentUrl
    @previewImageUrl = previewImageUrl
  end
end
