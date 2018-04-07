module EventsHelper
  def fee(money)
    money ? money : t(:free)
  end
end
