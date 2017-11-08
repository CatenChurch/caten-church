class LineBot::Formats::Actions::Uri < LineBot::Formats::Action
  attr_accessor :label, :uri

  def initialize(label, uri)
    @type = 'uri'
    @label = label
    @uri = uri
  end
end
