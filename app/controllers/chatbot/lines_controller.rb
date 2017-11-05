class Chatbot::LinesController < Chatbot::BaseController
  def callback
    render plain: 'success', status: 200
  end
end
