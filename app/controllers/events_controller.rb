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
    flash[:notice] = t('.success')
  rescue ActiveRecord::RecordInvalid => e
    flash[:alert] = "#{t('.failed')} : #{e.record.errors.messages.values.join(',')}"
  ensure
    redirect_to event_url(@event)
  end

  def quit
    current_user.quit! @event
    flash[:notice] = t('.success')
  rescue ActiveRecord::RecordNotFound => _e
    flash[:alert] = "#{t('.failed')} : #{t('.no_joined')}"
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
    redirect_to(event_url(@event), alert: t('events.show_participants_closed')) and return unless @event.show_participants
    # didn't join this event
    redirect_to(event_url(@event), alert: t('events.join_to_show_participant')) and return unless current_user&.joined?(@event)
  end

  def check_registration
    redirect_to(event_url(@event), alert: t('events.not_on_registration')) and return unless @event.on_registration?
  end

  def check_full
    redirect_to(event_url(@event), alert: t('events.is_full')) and return if @event.full?
  end
end
