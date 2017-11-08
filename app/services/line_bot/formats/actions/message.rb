class LineBot::Formats::Actions::Message < LineBot::Formats::Action
  attr_accessor :label, :text

  def initialize(label, text)
    @type = 'message'
    @label = label
    @text = text
  end
end
