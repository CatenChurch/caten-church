module ApplicationHelper
  def notice_message
    # 配合 Bootstrap 的警告元件
    alert_types = { notice: :success, alert: :danger, warning: :warning }
    close_button_options = { class: 'close', 'data-dismiss': 'alert', 'aria-hidden': true }
    close_button = content_tag(:button, '×', close_button_options)
    alerts = flash.map do |type, message|
      alert_content = close_button + message
      alert_type = alert_types[type.to_sym] || type
      alert_class = "alert alert-#{alert_type} alert-dismissable"
      content_tag(:div, alert_content, class: alert_class)
    end
    alerts.join("\n").html_safe
  end

  def nav_li(text, path, css_class: '', method: :get, inner_class: '', target: nil)
    active = request.path == path ? 'active' : ''
    css_class += ' nav-item'
    content_tag :li, link_to(text, path, method: method, class: "nav-link #{active} #{inner_class}", target: target), class: css_class
  end

  def nav_params_li(text, path, check_params: {}, css_class: '', method: :get, inner_class: '')
    match_all_params = true
    check_params.each do |key, value|
      next if request.GET.fetch(key, '').to_sym == value.to_sym

      match_all_params = false
    end
    params_start_at = path.index('?')
    base_path = (params_start_at ? (path[0..params_start_at]) : path)
    active = (match_all_params && request.path == base_path ? 'active' : '')
    content_tag :li, link_to(text, path, method: method, class: "nav-link #{active} #{inner_class}"), class: "#{css_class} nav-item"
  end
end
