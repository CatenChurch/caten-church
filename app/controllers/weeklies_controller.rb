# frozen_string_literal: true

class WeekliesController < ApplicationController
  def index
    @weeklies = Weekly.all.order(id: :desc).page(params[:page])
  end

  def show
    @weekly = Weekly.find(params[:id])
    respond_to do |format|
      format.html {}
      format.pdf { redirect_to_file_fallback_to_page(@weekly) }
    end
  end

  def latest
    @weekly = Weekly.order(id: :desc).find_by!('published_at <= ?', DateTime.now)
    redirect_to_file_fallback_to_page(@weekly)
  end

  private

  def redirect_to_file_fallback_to_page(weekly)
    if weekly.pdf.attached?
      redirect_to rails_blob_path(weekly.pdf)
    else
      redirect_to weekly, alert: '沒有上傳 PDF 附件'
    end
  end
end
