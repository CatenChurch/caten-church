# frozen_string_literal: true

class WeekliesController < ApplicationController
  before_action :find_weekly, only: [:show]
  before_action :check_pdf_attached, only: [:show]

  def index
    @weeklies = Weekly.all.order(id: :desc).page(params[:page])
  end

  def show
    @weekly.viewed_count += 1
    @weekly.save!

    respond_to do |format|
      format.html {}
      format.pdf { redirect_to rails_blob_path(@weekly.pdf) }
    end
  end

  def latest
    @weekly = Weekly.order(id: :desc).find_by!('published_at <= ?', DateTime.now)
    respond_to do |format|
      format.pdf { redirect_to weekly_url(@weekly, format: :pdf) }
      format.any { redirect_to weekly_url(@weekly) }
    end
  end

  private

  def find_weekly
    @weekly = Weekly.find(params[:id])
  end

  def check_pdf_attached
    redirect_to @weekly, alert: '沒有上傳 PDF 附件' unless @weekly.pdf.attached?
  end
end
