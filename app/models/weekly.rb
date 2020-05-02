# frozen_string_literal: true

class Weekly < ApplicationRecord
  has_one_attached :pdf
  validates_presence_of :title, :issue, :published_at
  validates_numericality_of :issue
  validate :attached_validations

  private

  def attached_validations
    attached_presence_validated? && attached_type_validated? && attached_size_validated?
  end

  def attached_presence_validated?
    return true if pdf.attached?

    errors.add(:pdf, '需附加檔案')
    false
  end

  def attached_type_validated?
    accept_types = %w[application/pdf]
    return true if accept_types.include? pdf.content_type

    errors.add(:pdf, "檔案類型須為 application/pdf, 目前是 #{pdf.content_type}")
    false
  end

  def attached_size_validated?
    max_size = 3.megabytes
    return true if pdf.byte_size <= max_size

    errors.add(:pdf, "檔案須小於 #{human_size max_size}, 目前是 #{human_size pdf.byte_size}")
    false
  end

  def human_size(bytes)
    ApplicationController.helpers.number_to_human_size bytes
  end
end
