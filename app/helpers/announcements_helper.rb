module AnnouncementsHelper
  def markdown(text)
    options = {   
      :autolink => true,
      :tables => true, 
      :space_after_headers => true,
      :fenced_code_blocks => true,
      :no_intra_emphasis => true,
      :hard_wrap => true,
      :strikethrough => true,
      :underline => true,
      :highlight => true,
      :quote => true,
      :footnotes => true
    }
    renderer = Redcarpet::Render::HTML.new
    markdown = Redcarpet::Markdown.new(renderer,options)
    markdown.render(text).html_safe
  end
end
