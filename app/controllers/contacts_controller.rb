class ContactsController < ApplicationController
  before_action :set_contact, only: %i[show edit update destroy]

  def create
    @contact = Contact.new(contact_params)

    if @contact.save
      flash[:notice] = '您的訊息已成功送出，請稍候等待我們的回覆。'
      redirect_to contact_url
    else
      flash[:alert] = '送出訊息時發生了一點問題'
      render 'pages/contact'
    end
  end

  private

  def contact_params
    params.require(:contact).permit(:name, :email, :phone, :message)
  end
end
