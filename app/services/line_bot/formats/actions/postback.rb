class LineBot::Formats::Actions::Postback < LineBot::Formats::Action
  attr_accessor :label, :data, :text

  def initialize(label, data, text: '')
    @type = 'postback'
    @label = label
    @data = data
    @text = text unless text.blank?
  end
end
