class LineBot::Formats::Messages::Audio < LineBot::Formats::Message
  attr_accessor :originalContentUrl, :duration

  def initialize(originalContentUrl, duration)
    @type = 'audio'
    @originalContentUrl = originalContentUrl
    @duration = duration
  end
end
