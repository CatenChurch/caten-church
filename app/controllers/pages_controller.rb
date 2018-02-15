class PagesController < ApplicationController
  def index; end

  def about; end

  def contact
    @contact = Contact.new
  end

  def term; end

  def google_site_verification
    render layout: false
  end
end
