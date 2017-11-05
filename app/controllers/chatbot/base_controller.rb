class Chatbot::BaseController < ApplicationController
  protect_from_forgery with: :null_session

  def verification
    render plain: 'Success', status: 200
  end
end
