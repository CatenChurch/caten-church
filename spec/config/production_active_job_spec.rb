# frozen_string_literal: true

require 'rails_helper'
require 'open3'

# Boots the production environment in a separate process, since config/environments/production.rb
# can't be loaded into the test process.
RSpec.describe 'Production Active Job adapter' do
  def production_queue_adapter(env = {})
    env = { 'RAILS_ENV' => 'production', 'SECRET_KEY_BASE_DUMMY' => '1',
            'ACTIVE_JOB_QUEUE_ADAPTER' => nil }.merge(env)
    output, status = Open3.capture2e(env, 'bin/rails', 'runner', 'print ActiveJob::Base.queue_adapter_name',
                                     chdir: Rails.root.to_s)
    expect(status).to be_success, output
    output.lines.last.strip
  end

  it 'runs jobs in-process by default, so no worker or Redis is needed' do
    expect(production_queue_adapter).to eq('async')
  end

  it 'can be switched to Sidekiq with ACTIVE_JOB_QUEUE_ADAPTER' do
    expect(production_queue_adapter('ACTIVE_JOB_QUEUE_ADAPTER' => 'sidekiq')).to eq('sidekiq')
  end
end
