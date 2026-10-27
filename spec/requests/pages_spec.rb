# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Pages', type: :request do
  it 'responds to the health check' do
    get rails_health_check_path
    expect(response).to have_http_status(:ok)
  end

  %w[/ /about /contact /term /tithing /weeklies /groups /group_reports].each do |path|
    it "renders #{path}" do
      get path
      expect(response).to have_http_status(:ok)
    end
  end

  it 'renders the sign in and sign up pages' do
    get new_user_session_path
    expect(response).to have_http_status(:ok)
    get new_user_registration_path
    expect(response).to have_http_status(:ok)
  end
end
