# frozen_string_literal: true

class Account::ProfilesController < Account::BaseController
  before_action :get_profile, only: %i[show edit update]

  def new
    redirect_to edit_account_profile_url if current_user.profile.present?
    @profile = Profile.new
  end

  def create
    @profile = current_user.build_profile(profile_params)
    if @profile.save
      flash[:notice] = '建立個人資料成功'
      redirect_to account_profile_url
    else
      flash[:alert] = '建立個人資料失敗'
      render :new
    end
  end

  def show; end

  def update
    if @profile.update(profile_params)
      flash[:notice] = '更新個人資料成功'
      redirect_to account_profile_url
    else
      flash[:alert] = '更新個人資料失敗'
      render :edit
    end
  end

  private

  def get_profile
    @profile = current_user.profile
    @profile.valid_for_joining_event = session[:valid_for_joining_event]
    if @profile.blank?
      flash[:warning] = '尚未建立個人資料'
      redirect_to new_account_profile_url
    end
  end

  def profile_params
    params.require(:profile).permit(:name, :sex, :birth, :phone, :cellphone, :address, :education, :terms_of_service, :id_number, :emergency_contact)
  end
end
