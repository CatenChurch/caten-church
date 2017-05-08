class EventsController < ApplicationController
  authorize_resource # cancancan
  before_action :find_event, only: [:show, :join, :quit, :show_participants]
  before_action :check_user_has_profile, only: [:join]
  before_action :check_event_can_be_join, only: [:join]
  before_action :check_user_already_join_event, only: [:quit]
  def index
    @events = Event.in_registration_time
    @expired_events = Event.sign_up_expired.page(params[:page])
  end

  def show; end

  def join
    if @event.join_by current_user
      flash[:notice] = '報名活動操作成功'
    else
      flash[:danger] = '本次報名操作失敗'
    end
    redirect_to event_path(@event)
  end

  def quit
    if @event.quit_by(current_user)
      flash[:alert] = '已取消報名此活動'
    else
      flash[:warning] = '報名截止，無法取消報名'
    end
    redirect_to event_path(@event)
  end

  def show_participants
    # n+1 queries 修正
    @participants = @event.participants.includes(:profile).order(:id)
  end

  private

  def find_event
    @event = Event.find(params[:id])
  end

  def check_user_has_profile
    unless current_user.has_profile?
      flash[:warning] = '填寫個人資料後再來報名活動'
      redirect_to new_account_profile_path
    end
  end

  def check_event_can_be_join
    unless @event.in_registration_time?
      flash[:warning] = '不在報名期限內'
      redirect_to event_path(@event)
    end

    if @event.is_full?
      flash[:warning] = '報名人數已滿'
      redirect_to event_path(@event)
    end
  end

  def check_user_already_join_event
    unless @event.participants.include?(current_user)
      flash[:warning] = '還沒報名此活動'
      redirect_to event_path(@event)
    end
  end
end
