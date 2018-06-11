class GroupReport < ApplicationRecord
  belongs_to :group, counter_cache: :reports_count
  belongs_to :creater, class_name: 'User', optional: true
end
