require 'test_helper'

class Admin::AnnouncementsControllerTest < ActionController::TestCase
  setup do
    @admin_announcement = admin_announcements(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:admin_announcements)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create admin_announcement" do
    assert_difference('Admin::Announcement.count') do
      post :create, admin_announcement: {  }
    end

    assert_redirected_to admin_announcement_path(assigns(:admin_announcement))
  end

  test "should show admin_announcement" do
    get :show, id: @admin_announcement
    assert_response :success
  end

  test "should get edit" do
    get :edit, id: @admin_announcement
    assert_response :success
  end

  test "should update admin_announcement" do
    patch :update, id: @admin_announcement, admin_announcement: {  }
    assert_redirected_to admin_announcement_path(assigns(:admin_announcement))
  end

  test "should destroy admin_announcement" do
    assert_difference('Admin::Announcement.count', -1) do
      delete :destroy, id: @admin_announcement
    end

    assert_redirected_to admin_announcements_path
  end
end
