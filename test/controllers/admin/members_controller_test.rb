require 'test_helper'

class Admin::MembersControllerTest < ActionController::TestCase
  setup do
    @admin_member = admin_members(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:admin_members)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create admin_member" do
    assert_difference('Admin::Member.count') do
      post :create, admin_member: {  }
    end

    assert_redirected_to admin_member_path(assigns(:admin_member))
  end

  test "should show admin_member" do
    get :show, id: @admin_member
    assert_response :success
  end

  test "should get edit" do
    get :edit, id: @admin_member
    assert_response :success
  end

  test "should update admin_member" do
    patch :update, id: @admin_member, admin_member: {  }
    assert_redirected_to admin_member_path(assigns(:admin_member))
  end

  test "should destroy admin_member" do
    assert_difference('Admin::Member.count', -1) do
      delete :destroy, id: @admin_member
    end

    assert_redirected_to admin_members_path
  end
end
