class LineBot::Formats::Messages::Template < LineBot::Formats::Message
  attr_accessor :altText, :template

  VALUES_TYPE = { '@template' => LineBot::Formats::Template }.freeze

  def initialize(altText, template)
    @type = 'template'
    @altText = altText
    @template = template
  end

  def to_h
    super
    {
      'type' => @type,
      'altText' => @altText,
      'template' => template.to_h
    }
  end
end
