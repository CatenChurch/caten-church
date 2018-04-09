class Admin::ContactsController < Admin::BaseController
  include Admin::ContactsHelper
  before_action :find_contact, only: [:show, :edit, :update, :destroy, :handle]

  def index
    @q = Contact.ransack(params[:q])
    @contacts = @q.result(distinct: true).order(:id).page(params[:page])
  end

  def show
  end

  def edit
  end

  def update
    if @contact.update(contact_params)
      flash[:notice] = t('.success')
      redirect_to admin_contact_url
    else
      flash[:alert] = t('.failed')
      render :edit
    end
  end

  def destroy
    @contact.destroy
    flash[:alert] = t('.success')
    redirect_to admin_contacts_url
  end

  def handle
    @contact.handled = !@contact.handled
    @contact.save!
    flash[:notice] = Contact.model_name.human + Contact.human_attribure_name("#{handled.(@contact.handled)}")
  end

  private
  def contact_params
    params.require(:contact).permit(:name, :email, :phone, :message, :handled)
  end

  def find_contact
    @contact = Contact.find(params[:id])
  end
end
