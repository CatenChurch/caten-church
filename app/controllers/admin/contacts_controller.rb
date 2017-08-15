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
      flash[:success] = "#{t('contact.edit')}#{t('success')}"
      redirect_to admin_contact_url
    else
      flash[:danger] = "#{t('contact.edit')}#{t('failed')}"
      render :edit
    end
  end

  def destroy
    @contact.destroy
    flash[:danger] = "#{t('contact._')}已刪除"
    redirect_to admin_contacts_url
  end

  def handle
    @contact.handled = !@contact.handled
    @contact.save!
    flash[:success] = "#{t('contact._')}#{handle_status(@contact.handled)}"
    redirect_to admin_contact_url
  end

  private
  def contact_params
    params.require(:contact).permit(:name, :email, :phone, :message, :handled)
  end

  def find_contact
    @contact = Contact.find(params[:id])
  end
end
