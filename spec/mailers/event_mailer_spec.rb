# frozen_string_literal: true

require 'rails_helper'

RSpec.describe EventMailer, type: :mailer do
  describe 'opening_notice' do
    let(:event) { create(:event) }
    let(:user) { create(:user) }
    let(:mail) { described_class.opening_notice(event, user) }

    it 'renders the headers' do
      expect(mail.subject).to eq("茄典教會活動提醒 : #{event.name}")
      expect(mail.to).to eq([user.email])
      expect(mail.from).to eq(['notify@caten-church.org'])
    end

    it 'renders the body' do
      expect(mail.html_part.decoded).to include(event.name)
      expect(mail.text_part.decoded).to include(event.name)
    end
  end
end
