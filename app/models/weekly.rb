# frozen_string_literal: true

class Weekly < ApplicationRecord
  has_one_attached :pdf
  validates_presence_of :title, :issue, :published_at
  validates_numericality_of :issue
  validate :pdf_validations

  private

  def pdf_validations
    errors.add(:pdf, '需附加檔案') && return unless pdf.attached?
    accept_types = %w[application/pdf]
    unless accept_types.include? pdf.content_type
      errors.add(:pdf, "檔案類型須為 application/pdf, 目前是 #{pdf.content_type}")
    end
    max_size = 3.megabytes
    if pdf.byte_size > max_size
      errors.add(:pdf, "檔案須小於 #{human_size max_size}, 目前是 #{human_size pdf.byte_size}")
    end
  end

  def human_size(bytes)
    ApplicationController.helpers.number_to_human_size bytes
  end
end
