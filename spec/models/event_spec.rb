# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Event, type: :model do
  it 'is valid with sensible times' do
    expect(build(:event)).to be_valid
  end

  it 'requires the event to start before it ends' do
    event = build(:event, start: 3.days.from_now, over: 2.days.from_now)
    expect(event).not_to be_valid
    expect(event.errors[:start]).to be_present
  end

  it 'requires the maximum sign-up number to be at least the minimum' do
    event = build(:event, max_sign_up_number: 1, min_sign_up_number: 5)
    expect(event).not_to be_valid
    expect(event.errors[:max_sign_up_number]).to be_present
  end

  it 'is open for registration between sign_up_begin and sign_up_end' do
    expect(build(:event)).to be_on_registration
    expect(build(:event, sign_up_begin: 2.days.ago, sign_up_end: 1.day.ago)).not_to be_on_registration
  end
end
