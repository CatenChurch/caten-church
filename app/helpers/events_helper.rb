module EventsHelper
  def need(boolean)
    boolean ? t(:need) : t(:no_need)
  end

  def fee(money)
    money ? money : t(:free)
  end
end
