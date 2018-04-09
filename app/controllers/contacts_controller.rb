class ContactsController < ApplicationController
  before_action :set_contact, only: [:show, :edit, :update, :destroy]

  def create
    @contact = Contact.new(contact_params)

    if @contact.save
      flash[:notice] = t('.success')
      redirect_to contact_url
    else
      flash[:alert] = t('.failed')
      render 'pages/contact'
    end
  end

  private

  def contact_params
    params.require(:contact).permit(:name, :email, :phone, :message)
  end
end
