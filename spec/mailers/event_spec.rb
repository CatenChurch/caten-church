require "rails_helper"

RSpec.describe EventMailer, type: :mailer do
  describe "opening_countdown_notice" do
    let(:mail) { EventMailer.opening_countdown_notice }

    it "renders the headers" do
      expect(mail.subject).to eq("Opening countdown notice")
      expect(mail.to).to eq(["to@example.org"])
      expect(mail.from).to eq(["from@example.com"])
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("Hi")
    end
  end

end
