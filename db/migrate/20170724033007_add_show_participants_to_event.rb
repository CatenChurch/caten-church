class AddShowParticipantsToEvent < ActiveRecord::Migration[5.0]
  def change
    add_column :events, :show_participants, :boolean, default: true
  end
end
