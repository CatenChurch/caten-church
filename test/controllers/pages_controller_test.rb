require 'test_helper'

class PagesControllerTest < ActionController::TestCase
  test "should get news" do
    get :news
    assert_response :success
  end

end
