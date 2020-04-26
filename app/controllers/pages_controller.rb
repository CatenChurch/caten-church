# frozen_string_literal: true

class PagesController < ApplicationController
  def index; end

  def about; end

  def contact; end

  def term; end

  def tithing; end

  def google_site_verification
    render layout: false
  end
end
