class LineBot::Formats::Messages::Image < LineBot::Formats::Message
  attr_accessor :originalContentUrl, :previewImageUrl

  def initialize(originalContentUrl, previewImageUrl)
    @type = 'image'
    @originalContentUrl = originalContentUrl
    @previewImageUrl = previewImageUrl
  end
end
