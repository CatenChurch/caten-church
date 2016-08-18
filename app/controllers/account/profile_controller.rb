class Account::ProfileController < ApplicationController
    # 先確認登入 
    before_action :authenticate_user! 
    # 設定 @user
    before_action :set_user
    
    def new
        @profile = @user.build_profile
    end
    
    def create
        @profile = @user.build_profile(profile_params)
        if @profile.save
            # 會重新通過Routes，回到show頁面
            redirect_to :action => "show"
            flash[:notice] = "Profile successfully created."
        else
            render :action => "new"
            flash[:alert] = "fail to create a profile."
        end
    end
    
    def show
    end
    
    def edit
        @profile = @user.profile
    end
    
    def update
        @profile = @user.profile
        if @profile.update(profile_params)
            redirect_to :action => "show"
            flash[:notice] = "Profile successfully updated."
        else
            render :action => "edit"
            flash[:alert] = "fail to edit the profile."
        end
    end

    def term
        
    end
    
    private
    
    def set_user
        @user = current_user
    end
    
    def profile_params
	    params.require(:profile).permit(:name, :sex, :birth, :phone, :cellphone, :address, :email, :education, :terms_of_service)
    end
  
end
