class PostsController < ApplicationController
	# 這是 devise 內建的功能，只要把它放進 controller 裡面，
	# 就會自動驗證使用者是否入
	# if yes => 繼續下面的程序
	# if no => 轉到登入畫面
	# # 可使會員登入後才能使用這些 action
	before_action :authenticate_user!, only:[:new, :edit, :create, :update, :destroy]

	# 每個 action 執行時都會先執行 find_group
	before_action :find_group
	def find_group
		@group = Group.find(params[:group_id])
	end

	# 只有這些 action 執行時會先執行 find_post
	before_action :find_post, only:[:edit, :update, :destroy]
	def find_post
		@post = current_user.posts.find(params[:id])
	end

	# 只有這些 action 執行時會先確認 member required
	before_action :member_required, only: [:new, :create ]

	def new
		@post = @group.posts.new
	end
	def edit
	end
	def create
		@post = @group.posts.build(post_params)
		@post.author = current_user
		if @post.save
			redirect_to group_path(@group)
			flash[:success] = "新增文章成功"
		else
			render :new
		end
	end
	def update
		if @post.update(post_params)
			redirect_to group_path(@group)
			flash[:success] = "修改文章成功"
		else
			render :edit
		end
	end
	def destroy
		@post.destroy
		redirect_to group_path(@group)
		flash[:danger] = "文章已刪除"
	end

	private

	def post_params
		params.require(:post).permit(:content)
	end
	def member_required
		if !current_user.is_member_of?(@group)
			flash[:warning] = "你不是這個討論版的成員，不能發文喔！"
			redirect_to group_path(@group)
		end
	end
end
