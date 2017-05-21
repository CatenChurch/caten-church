class Admin::EventUsersController < AdminController
  before_action :set_event_users, only: [:edit, :show, :update]
  def edit; end

  def show; end

  def update
    query_success = true
    @event_users.each do |e|
      id = e.id.to_s
      # FIXME: heroku use ruby 2.2, so dig no work.
      # dig_result = event_users_params.dig(id, 'activated')
      dig_result = event_users_params[id]['activated']
      if dig_result == '1' && !e.activated
        e.activated = true
        query_success = (e.save || query_success)
      elsif dig_result == '0' && e.activated
        e.activated = false
        query_success = (e.save || query_success)
      end
    end
    # 這行會執行每個EventUser的SQL，即使沒有更新
    # query_success = @event_users.update(event_users_params.keys, event_users_params.values)
    if query_success
      flash[:notice] = 'Successfully updated event_users.'
      redirect_to admin_event_event_users_url
    else
      flash[:warning] = 'Updated event_users failed.'
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
