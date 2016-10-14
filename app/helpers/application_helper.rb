module ApplicationHelper
	# 參考以下網頁:
	# http://courses.growthschool.com/courses/rails-101/lectures/229433
	# 用法:把 <%= notice_message %> 放進 application.html.erb 裡面
	# 在 controller 的方法中放入 flash[:success] = "訊息"
	# 或是 flash[:info] = "訊息"
	# 或是 flash[:warning] = "訊息"
	# 或是 flash[:danger] = "訊息"
	def notice_message
		#參考Bootstrap的警告元件
		alert_types = { notice: :success, alert: :danger, success: :success, info: :info, warning: :warning, danger: :danger }

		close_button_options = { class: "close", "data-dismiss" => "alert", "aria-hidden" => true }
		close_button = content_tag(:button, "×", close_button_options)

		alerts = flash.map do |type, message|
			alert_content = close_button + message

			alert_type = alert_types[type.to_sym] || type
			alert_class = "alert alert-#{alert_type} alert-dismissable"

			content_tag(:div, alert_content, class: alert_class)
		end

		alerts.join("\n").html_safe
	end
	
	# 被選中的巡覽列的class會加入active 做出區別的特效
  # navbar中的li tag 加入class="active"
  def nav_li text, path
    active = request.path == path ? :active :nil
    content_tag :li, link_to(text, path), class: active
  end
end
