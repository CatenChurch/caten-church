module Admin::EventUsersHelper
  def paid(boolean)
    boolean ? t('event_user.paid.y') : t('event_user.paid.n')
  end

  def arrival(boolean)
    boolean ? t('event_user.arrival.y') : t('event_user.arrival.n')
  end
end
