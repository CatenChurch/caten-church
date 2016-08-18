class Profile < ActiveRecord::Base
	belongs_to :user

	# 必填欄位
	validates_presence_of  :name, :sex, :birth, :email
	# email 正規表示法
	validates_format_of :email, :with => /\A\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z]+\z/
	# 同意規範
	validates :terms_of_service, acceptance: true
	# 自訂驗證
	validate :myValid

	private
	def myValid
		
	end

end
