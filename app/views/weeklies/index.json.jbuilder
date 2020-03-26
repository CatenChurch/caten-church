# frozen_string_literal: true

json.array! @weeklies, partial: 'weeklies/weekly', as: :weekly
