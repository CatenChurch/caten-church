# frozen_string_literal: true

require 'open3'

# Boots the production environment in a separate process, since config/environments/production.rb
# can't be loaded into the test process. ENV keys set to nil are removed for the child process.
module ProductionRunner
  def run_in_production(code, env = {})
    env = { 'RAILS_ENV' => 'production', 'SECRET_KEY_BASE_DUMMY' => '1' }.merge(env)
    Open3.capture2e(env, 'bin/rails', 'runner', code, chdir: Rails.root.to_s)
  end
end

RSpec.configure do |config|
  config.include ProductionRunner, type: :production_boot
end
