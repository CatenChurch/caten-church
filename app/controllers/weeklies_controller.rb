class WeekliesController < ApplicationController
  def index
    @weeklies = Weekly.all.order(id: :desc).page(params[:page])
  end

  def show
    @weekly = Weekly.find(params[:id])
  end
end
