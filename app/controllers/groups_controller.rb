class GroupsController < ApplicationController
  before_action :set_group, only: %i[show]

  def index
    @groups = Group.all.includes(leader: :profile).order(:id).page(params[:page])
  end

  def show; end

  private

  def set_group
    @group = Group.find(params[:id])
  end
end
