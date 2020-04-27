# frozen_string_literal: true

namespace :counter_cache do
  desc 'Reset counter_cache for Event'
  task reset: :environment do
    Event.pluck(:id).each do |id|
      Event.reset_counters id, :participants
    end
  end
end
