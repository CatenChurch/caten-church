class Ability
  include CanCan::Ability

  def initialize(user)
    can :read, Event
    
    if user.blank? # 訪客
      user = User.new
    else
      can :manage, :account
      can [:join, :quit, :participants], Event
    end

    user.roles
    can :manage, :admin if user.has_cached_role?(:admin) # 管理員

  end
end
