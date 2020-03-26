# frozen_string_literal: true

class Admin::ContactsController < Admin::BaseController
  before_action :find_contact, only: %i[show edit update destroy handle]

  def index
    @q = Contact.ransack(params[:q])
    @contacts = @q.result(distinct: true).order(:id).page(params[:page])
  end

  def show; end

  def edit; end

  def update
    if @contact.update(contact_params)
      flash[:notice] = '編輯聯絡訊息成功'
      redirect_to admin_contact_url
    else
      flash[:alert] = '編輯聯絡訊息失敗'
      render :edit
    end
  end

  def destroy
    @contact.destroy
    flash[:alert] = '刪除聯絡訊息成功'
    redirect_to admin_contacts_url
  end

  def handle
    @contact.handled = !@contact.handled
    @contact.save!
    flash[:notice] = Contact.model_name.human + Contact.human_attribute_name("handle.#{@contact.handled}")
    redirect_to admin_contact_url(@contact)
  end

  private

  def contact_params
    params.require(:contact).permit(:name, :email, :phone, :message, :handled)
  end

  def find_contact
    @contact = Contact.find(params[:id])
  end
end
