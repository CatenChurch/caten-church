class Event < ActiveRecord::Base
  resourcify
	# 活動發起者
	belongs_to :organizer, class_name: "User", foreign_key: :user_id
	
	# event has many event_users
	# event has many members from user, and save in group_user
	# 刪除 event 會清空報名event的人的資料(participants)
	has_many :event_users
  has_many :participants, through: :event_users, source: :user, dependent: :destroy
	
	# 驗證
	# 必填欄位
  validates_presence_of  :name, :max_sign_up_number, :sign_up_begin, :sign_up_end, :start, :over
  validate :myValid


	# 修改權限 哪些role有權限(目前使用cancancan)
	def manage_by?(user)
     user && user.has_any_role?(:admin, :manager) 
  end

  def can_join_event?
  	(self.participants_count < self.max_sign_up_number) && (self.sign_up_end.to_i >= DateTime.now.to_i) && (self.sign_up_begin.to_i <= DateTime.now.to_i)
  end


  private

  def myValid
  	if max_sign_up_number.to_i < min_sign_up_number.to_i
  		errors[:max_sign_up_number] << "max_sign_up_number can not small then min_sign_up_number"	
  	end
  	if sign_up_begin.to_i >= sign_up_end.to_i
  		errors[:sign_up_end] << "sign_up_end must >= sign_up_begin"	
  	end
  	if start.to_i >=  over.to_i
  		errors[:over] << "over must >= start"	
  	end
  	if sign_up_end.to_i >= start.to_i 
  		errors[:start] << "start must >= sign_up_end"	
  	end
  end

end
