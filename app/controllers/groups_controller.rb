class GroupsController < ApplicationController
	# 這是 devise 內建的功能，只要把它放進 controller 裡面，
	# 就會自動驗證使用者是否入
	# if yes => 繼續下面的程序
	# if no => 轉到登入畫面
	# # 可使會員登入後才能使用這些 action
	before_action :authenticate_user!, only:[:new, :edit, :create, :update, :destroy, :join, :quit]

	# only 這些 action 執行時會執行 find_group
	# 還有相對於 after_action 用於每個 action 執行後執行
	# 還有相對於 only 的 except
	before_action :find_group, only:[:show, :join, :quit] #, :edit, :update, :destroy]
	def find_group
		@group = Group.find(params[:id])
	end

	def index
		@groups = Group.all
	end
	def new
		@group = Group.new
	end
	def show
		@posts = @group.posts
	end
	def edit
		@group = current_user.groups.find(params[:id])
	end

	def create
		@group = current_user.groups.new(group_params)
		# @group = Group.create(group_params)

		if @group.save
			# 創建 group 後自動 join group
			current_user.join_group(@group)

			redirect_to groups_path
			flash[:success] = "討論版建立成功"
		else
			render :new
		end
	end
	def update
		@group = current_user.groups.find(params[:id])

		if @group.update(group_params)
			redirect_to groups_path
			flash[:success] = "討論版修改成功"
		else
			render :edit
		end
	end
	def destroy
		@group = current_user.groups.find(params[:id])

		@group.destroy
		redirect_to groups_path
		flash[:danger] = "討論版已刪除"
	end

	def join
		if !current_user.is_member_of_group?(@group)
			current_user.join_group(@group)
			flash[:notice] = "加入本討論版成功！"
		else
			flash[:warning] = "你已經是本討論版成員了！"
		end

		redirect_to group_path(@group)
	end

	def quit
		if current_user.is_member_of_group?(@group)
			current_user.quit_group(@group)
			flash[:alert] = "已退出本討論版！"
		else
			flash[:warning] = "你不是本討論版成員"
		end
		redirect_to group_path(@group)
	end

	private

	def group_params
		params.require(:group).permit(:title, :description)
	end

end
