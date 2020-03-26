# frozen_string_literal: true

class FacebookMessengerService
  def initialize(params)
    @entry = params[:entry]
    @messages = @entry.map { |e| e.fetch(:messaging) { [] } }.flatten(1)
  end

  def perform
    @messages.each do |message|
      sender_id = message.dig(:sender, :id)
      messenger = Messenger.find_or_create_by!(provider: 'facebook', uid: sender_id)
      ref = message.dig(:optin, :ref)
      # activate messenger
      if ref.present?
        ref_hash = ref.split('::').map { |e| e.split('=') }.to_h
        user = User.find_by(id: ref_hash['user_id'], auth_token: ref_hash['auth_token'])
        if ref_hash['action'] == 'activate_messenger'
          messenger.update!(activated: true, user_id: user.id)
        end
      end
      # normal conversation
      ## no code yet
    rescue StandardError
      next
    end
  end
end
