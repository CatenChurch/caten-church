class LineBot::Formats::Messages::Sticker < LineBot::Formats::Message
  attr_accessor :packageId, :stickerId

  def initialize(packageId, stickerId)
    @type = 'sticker'
    @packageId = packageId
    @stickerId = stickerId
  end
end
