# frozen_string_literal: true

module EventsHelper
  def fee(money)
    money || t(:free)
  end
end
