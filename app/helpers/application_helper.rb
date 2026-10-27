# frozen_string_literal: true

module ApplicationHelper
  def notice_message
    # 配合 Bootstrap 的警告元件
    alert_types = { notice: :success, alert: :danger, warning: :warning }
    close_button = content_tag(:button, nil, type: 'button', class: 'btn-close',
                                             'data-bs-dismiss': 'alert', 'aria-label': 'Close')
    alerts = flash.map do |type, message|
      alert_type = alert_types[type.to_sym] || type
      alert_class = "alert alert-#{alert_type} alert-dismissible fade show"
      content_tag(:div, safe_join([message, close_button]), class: alert_class, role: 'alert')
    end
    safe_join(alerts, "\n")
  end
end
