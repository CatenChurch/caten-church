# frozen_string_literal: true

FactoryBot.define do
  factory :event do
    sequence(:name) { |n| "青年團契活動 #{n}" }
    description { '活動簡介' }
    content { '活動內容' }
    max_sign_up_number { 30 }
    min_sign_up_number { 5 }
    sign_up_begin { 1.day.ago }
    sign_up_end { 1.day.from_now }
    start { 2.days.from_now }
    over { 3.days.from_now }
    organizer factory: :user
  end
end
