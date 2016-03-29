module NavbarHelper
  # 被選中的巡覽列的class會加入active 做出區別的特效
  # navbar中的li tag 加入class="active"
  def nav_li text, path
    active = request.path == path ? :active :nil
    content_tag :li, link_to(text, path), class: active
  end
end
