class Admin::EventUsersController < Admin::BaseController
  before_action :set_event_users, only: %i[edit show update]
  def edit; end

  def show; end

  def update
    query_success = true

    @event_users.each do |e|
      id = e.id.to_s
      change = false
      paid = event_users_params.dig(id, 'paid')
      arrival = event_users_params.dig(id, 'arrival')

      if paid == '1' && !e.paid
        e.paid = true
        change = true
      elsif paid == '0' && e.paid
        e.paid = false
        change = true
      end
      if arrival == '1' && !e.arrival
        e.arrival = true
        change = true
      elsif arrival == '0' && e.arrival
        e.arrival = false
        change = true
      end

      query_success = (e.save || query_success) if change
    end
    if query_success
      flash[:notice] = '更新報名者狀態成功'
      redirect_to admin_event_event_users_url
    else
      flash[:warning] = '更新報名者狀態失敗'
      render 'edit'
    end
  end

  private

  def set_event_users
    @event_users = EventUser.where(event_id: params[:event_id]).includes(user: :profile).order(:id)
  end

  def event_users_params
    params.require(:event_users).permit!
  end
end
