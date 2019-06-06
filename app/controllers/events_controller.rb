class EventsController < ApplicationController
  authorize_resource # cancancan Event

  before_action :find_event, only: %i[show join quit participants]
  before_action :check_profile, only: [:join]
  before_action :check_registration, only: %i[join quit]
  before_action :check_full, only: [:join]
  before_action :check_participants, only: [:participants]

  def index
    @events = Event.in_registration_time.order(id: :desc)
    @expired_events = Event.sign_up_expired.order(id: :desc).page(params[:page]).per(6)
  end

  def show; end

  def join
    current_user.join! @event, remark: params[:remark]
    flash[:notice] = '報名活動成功'
  rescue ActiveRecord::RecordInvalid => e
    flash[:alert] = "報名活動失敗 : #{e.record.errors.messages.values.join(',')}"
  ensure
    redirect_to event_url(@event)
  end

  def quit
    current_user.quit! @event
    flash[:notice] = '取消報名活動成功'
  rescue ActiveRecord::RecordNotFound => e
    flash[:alert] = "取消報名活動失敗: #{e.record.errors.messages.values.join(',')}"
  ensure
    redirect_to event_url(@event)
  end

  def participants
    @event_users = EventUser.where(event: @event).includes(user: :profile).order(:id)
  end

  private

  def find_event
    @event = Event.find(params[:id])
  end

  def check_participants
    # can't show participants
    redirect_to(event_url(@event), alert: '報名情況未公開') && return unless @event.show_participants
    # didn't join this event
    redirect_to(event_url(@event), alert: '報名活動後才能觀看報名情況') && return unless current_user&.joined?(@event)
  end

  def check_profile
    current_user.profile&.valid_for_joining_event = true
    return if current_user.profile&.valid?

    session[:valid_for_joining_event] = true
    redirect_to(edit_account_profile_url, alert: '報名活動前需建立個人資料，請先前往 會員中心 > 個人資料 填寫資料然後報名')
  end

  def check_registration
    redirect_to(event_url(@event), alert: '目前不在報名時間內') and return unless @event.on_registration?
  end

  def check_full
    redirect_to(event_url(@event), alert: '報名人數已滿') and return if @event.full?
  end
end
