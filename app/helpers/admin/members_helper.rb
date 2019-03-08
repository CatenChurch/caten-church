module Admin::MembersHelper
  def become_admin_link(user, klass: '')
    css_class = "btn btn-sm btn-danger #{klass}"
    icon = 'gavel'
    text = '升為管理員'
    confirm = '確定要讓此用戶升為管理員嗎？'
    if Ability.new(user).can?(:manage, :admin)
      icon = 'ban'
      text = '降為一般會員'
      confirm = '確定要將此用戶降為一般會員嗎？'
    end
    link_to(fa_icon(icon, text: text), become_admin_admin_member_path(user),
            method: :post, class: css_class,
            data: { confirm: confirm, disable_with: t('button.submitting') })
  end
end
