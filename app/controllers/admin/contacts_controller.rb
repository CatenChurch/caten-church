class Admin::ContactsController < Admin::BaseController
  def index
    @q = Contact.ransack(params[:q])
    @contacts = @q.result(distinct: true).order(:id).page(params[:page])
  end

  def show
  end

  def edit
  end

  def update
  end

  def destroy
  end

  private
  def contact_params
    params.require(:contact).permit(:name, :email, :phone, :message)
  end
end
