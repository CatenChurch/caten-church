# frozen_string_literal: true

class DropContact < ActiveRecord::Migration[6.0]
  def change
    drop_table :contacts
  end
end
