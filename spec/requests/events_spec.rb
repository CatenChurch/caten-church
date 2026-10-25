# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Events', type: :request do
  let!(:event) { create(:event) }

  it 'lists events' do
    get events_path
    expect(response).to have_http_status(:ok)
    expect(response.body).to include(event.name)
  end

  it 'shows an event to a signed in member' do
    sign_in create(:user)
    get event_path(event)
    expect(response).to have_http_status(:ok)
    expect(response.body).to include('報名活動')
  end

  it 'redirects with an alert when quitting an event the member has not joined' do
    sign_in create(:user)
    post quit_event_path(event)
    expect(response).to redirect_to(event_url(event))
    expect(response).to have_http_status(:see_other)
    expect(flash[:alert]).to eq('取消報名活動失敗: 尚未報名此活動')
  end
end
