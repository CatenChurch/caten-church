module Admin::ContactsHelper
  def handle_status(boolean)
    boolean ? t('contact.handle.y') : t('contact.handle.n')
  end
end
