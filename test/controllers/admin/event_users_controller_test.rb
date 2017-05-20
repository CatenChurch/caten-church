require 'test_helper'

class Admin::EventUsersControllerTest < ActionDispatch::IntegrationTest
  test "should get edit" do
    get admin_event_users_edit_url
    assert_response :success
  end

  test "should get show" do
    get admin_event_users_show_url
    assert_response :success
  end

  test "should get update" do
    get admin_event_users_update_url
    assert_response :success
  end

end
