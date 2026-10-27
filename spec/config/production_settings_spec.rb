# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Production settings', type: :production_boot do
  # Boot without the dummy secret so config/initializers/required_settings.rb runs, and without
  # any of the settings it checks. Credentials are empty because there is no master key here.
  let(:bare_env) do
    {
      'SECRET_KEY_BASE_DUMMY' => nil, 'SKIP_REQUIRED_SETTINGS_CHECK' => nil, 'RAILS_MASTER_KEY' => nil,
      'SECRET_KEY_BASE' => 'x' * 64, 'DATABASE_URL' => 'postgres://localhost/not_used',
      'ACTIVE_STORAGE_SERVICE' => nil, 'SENDGRID_API_KEY' => nil,
      'FACEBOOK_APP_ID' => nil, 'FACEBOOK_APP_SECRET' => nil,
      'LINE_CHANNEL_SECRET' => nil, 'LINE_CHANNEL_TOKEN' => nil
    }
  end
  let(:all_settings) do
    { 'ACTIVE_STORAGE_SERVICE' => 'local', 'SENDGRID_API_KEY' => 'k',
      'FACEBOOK_APP_ID' => 'id', 'FACEBOOK_APP_SECRET' => 'secret',
      'LINE_CHANNEL_SECRET' => 'secret', 'LINE_CHANNEL_TOKEN' => 'token' }
  end

  before do
    skip 'needs empty credentials (config/master.key or RAILS_MASTER_KEY is present)' if
      Rails.root.join('config/master.key').exist? || ENV['RAILS_MASTER_KEY'].present?
  end

  it 'refuses to boot and lists every missing setting' do
    output, status = run_in_production('print :booted', bare_env)
    expect(status).not_to be_success
    expect(output).to include('Missing required production settings')
    %w[SENDGRID_API_KEY FACEBOOK_APP_ID FACEBOOK_APP_SECRET LINE_CHANNEL_SECRET LINE_CHANNEL_TOKEN
       gcs.project_id gcs.private_key gcs.client_email].each do |name|
      expect(output).to include(name)
    end
  end

  it 'boots when every setting is present' do
    output, status = run_in_production('print :booted', bare_env.merge(all_settings))
    expect(status).to be_success, output
    expect(output).to end_with('booted')
  end

  it 'refuses to boot without a secret_key_base' do
    output, status = run_in_production('print :booted', bare_env.merge(all_settings).merge('SECRET_KEY_BASE' => nil))
    expect(status).not_to be_success
    expect(output).to include('secret_key_base')
  end

  it 'can be skipped with SKIP_REQUIRED_SETTINGS_CHECK' do
    output, status = run_in_production('print :booted', bare_env.merge('SKIP_REQUIRED_SETTINGS_CHECK' => '1'))
    expect(status).to be_success, output
  end
end
