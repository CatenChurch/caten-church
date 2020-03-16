class Weekly < ApplicationRecord
  has_one_attached :pdf
  validates_presence_of :title, :issue, :published_at
  validates_numericality_of :issue
end
