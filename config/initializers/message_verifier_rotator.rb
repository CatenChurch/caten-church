# frozen_string_literal: true

# Like cookie_rotator.rb, but for Rails.application.message_verifiers (ActiveStorage.verifier and
# other `Rails.application.message_verifier(name)` users). Rails 6.1 derived their keys with a SHA1
# key generator and serialized with Marshal, so blob URLs (e.g. weekly PDF links shared before the
# upgrade) would otherwise stop verifying. New messages are still signed with the current settings.
# This file can be removed once links signed before the upgrade no longer matter.
Rails.application.message_verifiers.rotate(
  secret_generator: lambda { |salt|
    ActiveSupport::KeyGenerator.new(
      Rails.application.secret_key_base, iterations: 1000, hash_digest_class: OpenSSL::Digest::SHA1
    ).generate_key(salt)
  },
  digest: 'SHA1',
  serializer: Marshal,
  use_message_serializer_for_metadata: false
)
