class EventsController < ApplicationController
  authorize_resource # cancancan Event

  before_action :find_event, only: [:show, :join, :quit, :participants]
  before_action :check_profile, only: [:join]
  before_action :check_registration, only: [:join, :quit]
  before_action :check_participants, only: [:participants]

  def index
    @events = Event.in_registration_time.order(id: :desc)
    @expired_events = Event.sign_up_expired.order(id: :desc).page(params[:page])
  end

  def show; end

  def join
    current_user.join @event
    flash[:notice] = t('event.joined')
  rescue ActiveRecord::RecordInvalid => e
    flash[:danger] = "#{t('event.join_failed')} : #{e.record.errors.messages.values.join(',')}"
  ensure
    redirect_to event_url(@event)
  end

  def quit
    current_user.quit @event
    flash[:warning] = t('event.quited')
  rescue ActiveRecord::RecordNotFound => e
    flash[:danger] = "#{t('event.quit_failed')} : #{t('event.did_not_join')}"
  ensure
    redirect_to event_url(@event)
  end

  def participants
    @event_users = EventUser.where(event: @event).includes(user: :profile).order(:id)
  end

  private

  def join_params
    params.permit(:remark)
  end

  def find_event
    @event = Event.find(params[:id])
  end

  def check_participants
    unless @event.show_participants
      flash[:warning] = t('event.show_participants_closed')
      redirect_to event_url(@event)
    end

    unless current_user.joined? @event
      flash[:warning] = t('event.join_to_show_participant')
      redirect_to event_url(@event)
    end
  end

  def check_profile
    unless current_user.has_valid_profile?
      flash[:warning] = t('event.no_profile')
      redirect_to edit_account_profile_url
    end
  end

  def check_registration
    unless @event.on_registration?
      flash[:warning] = t('event.not_on_registration')
      redirect_to event_url(@event)
    end

    if @event.full?
      flash[:warning] = t('event.is_full')
      redirect_to event_path(@event)
    end
  end

end
