module Account::SubscriptionHelper
  def messenger_list_item(title, hint, content = nil, &block)
    content_tag :div, class: 'list-group-item d-flex flex-wrap' do
      doms = []
      doms << content_tag(:strong, title)
      doms << content_tag(:span, hint, class: 'text-muted small ml-auto')
      doms << content_tag(:div, '', class: 'w-100')
      doms << content_tag(:div, content, class: 'ml-auto') if content
      if block_given?
        doms << content_tag(:div, class: 'ml-auto') do
          yield block
        end
      end
      doms.join("\n").html_safe
    end
  end
end
