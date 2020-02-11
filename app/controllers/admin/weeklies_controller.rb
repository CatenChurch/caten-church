# frozen_string_literal: true

class Admin::WeekliesController < Admin::BaseController
  before_action :set_weekly, only: %i[show edit update destroy]

  def index
    @weeklies = Weekly.all
  end

  def show; end

  def new
    @weekly = Weekly.new
  end

  def edit; end

  def create
    @weekly = Weekly.new(weekly_params)

    respond_to do |format|
      if @weekly.save
        format.html { redirect_to [:admin, @weekly], notice: 'Weekly was successfully created.' }
        format.json { render :show, status: :created, location: @weekly }
      else
        format.html { render :new }
        format.json { render json: @weekly.errors, status: :unprocessable_entity }
      end
    end
  end

  def update
    respond_to do |format|
      if @weekly.update(weekly_params)
        format.html { redirect_to [:admin, @weekly], notice: 'Weekly was successfully updated.' }
        format.json { render :show, status: :ok, location: @weekly }
      else
        format.html { render :edit }
        format.json { render json: @weekly.errors, status: :unprocessable_entity }
      end
    end
  end

  def destroy
    @weekly.destroy
    respond_to do |format|
      format.html { redirect_to admin_weeklies_url, notice: 'Weekly was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private

  def set_weekly
    @weekly = Weekly.find(params[:id])
  end

  def weekly_params
    params.require(:weekly).permit(:title, :issue, :published_at)
  end
end
