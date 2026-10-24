# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "member#{n}@example.com" }
    password { 'password1234' }
    confirmed_at { Time.current }

    trait :admin do
      after(:create) { |user| user.add_role(:admin) }
    end
  end
end
