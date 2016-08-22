require 'test_helper'

class Admin::EventsControllerTest < ActionController::TestCase
  setup do
    @admin_event = admin_events(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:admin_events)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create admin_event" do
    assert_difference('Admin::Event.count') do
      post :create, admin_event: {  }
    end

    assert_redirected_to admin_event_path(assigns(:admin_event))
  end

  test "should show admin_event" do
    get :show, id: @admin_event
    assert_response :success
  end

  test "should get edit" do
    get :edit, id: @admin_event
    assert_response :success
  end

  test "should update admin_event" do
    patch :update, id: @admin_event, admin_event: {  }
    assert_redirected_to admin_event_path(assigns(:admin_event))
  end

  test "should destroy admin_event" do
    assert_difference('Admin::Event.count', -1) do
      delete :destroy, id: @admin_event
    end

    assert_redirected_to admin_events_path
  end
end
