class Account::ProfilesController < Account::BaseController
  before_action :get_profile, only: [:show, :edit, :update]

  def new
    @profile = Profile.new
  end

  def create
    @profile = current_user.create_profile(profile_params)
    if @profile.save
      # 會重新通過Routes，回到show頁面
      redirect_to action: 'show'
      flash[:notice] = 'Profile successfully created.'
    else
      render action: 'new'
      flash[:alert] = 'fail to create a profile.'
    end
  end

  def show;  end

  def edit;  end

  def update
    if @profile.update(profile_params)
      redirect_to action: 'show'
      flash[:notice] = 'Profile successfully updated.'
    else
      render action: 'edit'
      flash[:alert] = 'fail to edit the profile.'
    end
  end

  private

  def get_profile
    @profile = current_user.profile
    if @profile.blank?
      flash[:warning] = '尚未建立個人資料，請填寫以下基本資料'
      redirect_to new_account_profile_path
    end
  end

  def profile_params
    params.require(:profile).permit(:name, :sex, :birth, :phone, :cellphone, :address, :education, :terms_of_service, :id_number, :emergency_contact)
  end
end
