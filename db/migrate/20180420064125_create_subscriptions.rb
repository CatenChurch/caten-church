class CreateSubscriptions < ActiveRecord::Migration[5.1]
  def change
    create_table :subscriptions do |t|
      t.boolean :new_events, default: false
      t.boolean :joined_events, default: true
      t.references :user, foreign_key: true

      t.timestamps
    end
    add_index :subscriptions, :new_events
    add_index :subscriptions, :joined_events

    # create subscriptions for each users
    say 'creating subscriptions for each users'
    inserts = User.ids.map { |id| "(#{id}, current_timestamp, current_timestamp)" }.join(',')
    sql = "insert into subscriptions (user_id, created_at, updated_at) values #{inserts}"
    ActiveRecord::Base.connection.execute(sql)
  end
end
