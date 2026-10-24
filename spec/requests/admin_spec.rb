# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Admin', type: :request do
  it 'redirects guests away from the admin dashboard' do
    get admin_path
    expect(response).to redirect_to(root_url)
  end

  context 'when signed in as an admin' do
    before { sign_in create(:user, :admin) }

    it 'renders the dashboard and lists' do
      create(:event)
      [admin_path, admin_events_path, admin_members_path, admin_groups_path, admin_weeklies_path].each do |path|
        get path
        expect(response).to have_http_status(:ok), "expected 200 for #{path}, got #{response.status}"
      end
    end

    it 'searches members with ransack' do
      get admin_members_path, params: { q: { email_cont: 'member', profile_name_cont: 'x' } }
      expect(response).to have_http_status(:ok)
    end

    it 'deletes an event and redirects with 303 for Turbo' do
      event = create(:event)
      delete admin_event_path(event)
      expect(response).to have_http_status(:see_other)
      expect(Event.exists?(event.id)).to be(false)
    end

    it 're-renders an invalid event form with 422 for Turbo' do
      post admin_events_path, params: { event: { name: '' } }
      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
