class Account::ProfilesController < Account::BaseController
  before_action :get_profile, only: [:show, :edit, :update]

  def new
    redirect_to edit_account_profile_url if current_user.profile.present?
    @profile = Profile.new
  end

  def create
    @profile = current_user.profile.new(profile_params)
    if @profile.save
      flash[:notice] = t('profile.created')
      redirect_to account_profile_url
    else
      flash[:alert] = t('profile.create_failed')
      render :new
    end
  end

  def show;  end

  def edit;  end

  def update
    if @profile.update(profile_params)
      flash[:notice] = t('profile.updated')
      redirect_to account_profile_url
    else
      flash[:alert] = t('profile.update_failed')
      render :edit
    end
  end

  private

  def get_profile
    @profile = current_user.profile
    if @profile.blank?
      flash[:warning] = t('profile.no_profile')
      redirect_to new_account_profile_url
    end
  end

  def profile_params
    params.require(:profile).permit(:name, :sex, :birth, :phone, :cellphone, :address, :education, :terms_of_service, :id_number, :emergency_contact)
  end
end
