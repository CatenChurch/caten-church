# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Production Active Job adapter', type: :production_boot do
  def production_queue_adapter(env = {})
    output, status = run_in_production('print ActiveJob::Base.queue_adapter_name',
                                       { 'ACTIVE_JOB_QUEUE_ADAPTER' => nil }.merge(env))
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
