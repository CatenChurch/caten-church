# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Production SSL settings', type: :production_boot do
  def production_ssl(env = {})
    code = 'print [Rails.application.config.force_ssl, Rails.application.config.assume_ssl].join(",")'
    output, status = run_in_production(code, { 'RAILS_FORCE_SSL' => nil, 'RAILS_ASSUME_SSL' => nil }.merge(env))
    expect(status).to be_success, output
    output.lines.last.strip
  end

  it 'does not force SSL (and so sends no HSTS) by default, but assumes SSL behind the proxy' do
    expect(production_ssl).to eq('false,true')
  end

  it 'forces SSL with RAILS_FORCE_SSL=true' do
    expect(production_ssl('RAILS_FORCE_SSL' => 'true')).to eq('true,true')
  end
end
