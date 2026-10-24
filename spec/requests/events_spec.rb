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
end
