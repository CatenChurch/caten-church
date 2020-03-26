# frozen_string_literal: true

class Chatbot::BaseController < ApplicationController
  # For API, skip CSRF protection
  skip_before_action :verify_authenticity_token
end
