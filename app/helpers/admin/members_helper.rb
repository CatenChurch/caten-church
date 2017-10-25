module Admin::MembersHelper
  def become_admin_link(user)
    if Ability.new(user).can?(:manage, :admin)
      link_to '取消管理員身份', cancel_admin_admin_member_path(user), method: :post , class: 'btn btn-sm btn-danger', data: { confirm: '確定要取消此用戶的管理員權限嗎？', disable_with: t('button.submitting')  }
    else
      link_to '成為管理員', become_admin_admin_member_path(user), method: :post , class: 'btn btn-sm btn-danger', data: { confirm: '確定要讓此用戶變成管理員權限嗎？', disable_with: t('button.submitting')  }
    end
  end
end
