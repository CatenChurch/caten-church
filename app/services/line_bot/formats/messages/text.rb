class LineBot::Formats::Messages::Text < LineBot::Formats::Message
  attr_accessor :text

  def initialize(text)
    @type = 'text'
    @text = text
  end
end
