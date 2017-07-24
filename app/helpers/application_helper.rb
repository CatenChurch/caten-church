module ApplicationHelper
  def notice_message
    # 參考以下網頁:
    # http://courses.growthschool.com/courses/rails-101/lectures/229433
    # 用法:把 <%= notice_message %> 放進 application.html.erb 裡面
    # 在 controller 的方法中放入 flash[:success] = "訊息"
    # 或是 flash[:info] = "訊息"
    # 或是 flash[:warning] = "訊息"
    # 或是 flash[:danger] = "訊息"

    # 參考Bootstrap的警告元件
    alert_types = { notice: :success, alert: :danger, success: :success, info: :info, warning: :warning, danger: :danger }

    close_button_options = { class: 'close', 'data-dismiss' => 'alert', 'aria-hidden' => true }
    close_button = content_tag(:button, '×', close_button_options)

    alerts = flash.map do |type, message|
      alert_content = close_button + message

      alert_type = alert_types[type.to_sym] || type
      alert_class = "alert alert-#{alert_type} alert-dismissable"

      content_tag(:div, alert_content, class: alert_class)
    end

    alerts.join("\n").html_safe
  end

  def nav_li(text, path, css_class: '', method: :get, inner_class: '')
    # 被選中的巡覽列的class會加入active 做出區別的特效
    # navbar中的li tag 加入class="active"
    active = request.path == path ? 'active' : ''
    css_class += ' nav-item'
    content_tag :li, link_to(text, path, method: method, class: "nav-link #{active} #{inner_class}"), class: css_class
  end

  def nav_params_li(text, path, check_params: {}, css_class: '', method: :get, inner_class: '')
    # 比對 path 與 params
    check = true
    check_params.each do |key, value|
      check = false if request.GET.fetch(key, '').to_sym != value.to_sym
    end
    base_path = if n = path.index('?')
                  path.byteslice(0..(n - 1))
                else
                  path
                end
    active = if check && request.path == base_path
               'active'
             else
               ''
             end
    content_tag :li, link_to(text, path, method: method, class: "nav-link #{active} #{inner_class}"), class: "#{css_class} nav-item"
  end

  def is_admin?
    can? :manage, Admin
  end

  def boolean_to_y_or_n(boolean)
    boolean ? t(:y) : t(:n)
  end
end
