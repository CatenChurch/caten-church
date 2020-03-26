# frozen_string_literal: true

namespace :counter_cache do
  desc 'Reset counter_cache for Event and Service::Team.'
  task reset_all: :environment do
    Rails.logger.info 'task START: reset all counter_cache.'
    Event.pluck(:id).each do |id|
      Event.reset_counters id, :participants
    end
    Rails.logger.info 'Event participants_count refreshed.'

    team_ids = Service::Team.pluck(:id)
    team_ids.each do |id|
      Service::Team.reset_counters id, :users
    end
    Rails.logger.info 'Service::Team users_count refreshed.'
    team_ids.each do |id|
      Service::Team.reset_counters id, :schedules
    end
    Rails.logger.info 'Service::Team schedules_count refreshed.'
    Rails.logger.info 'task END : reset all counter_cache.'
  end
end
