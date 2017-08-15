require 'rails_helper'

RSpec.describe Contact, type: :model do
  describe "attributes" do
    it "have name" do
      c = Contact.new(name: "Aaron")
      expect(c.name.class).to be String
    end
  end
end
