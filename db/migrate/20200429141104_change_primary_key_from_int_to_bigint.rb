# frozen_string_literal: true

class ChangePrimaryKeyFromIntToBigint < ActiveRecord::Migration[6.0]
  def up
    # Warning: this operation will lock the table

    # primary keys
    change_column :events, :id, :bigint
    change_column :event_users, :id, :bigint
    change_column :oauths, :id, :bigint
    change_column :profiles, :id, :bigint
    change_column :roles, :id, :bigint
    change_column :users, :id, :bigint

    # foreign keys
    change_column :users_roles, :user_id, :bigint
    change_column :users_roles, :role_id, :bigint
    change_column :roles, :resource_id, :bigint
    change_column :profiles, :user_id, :bigint
    change_column :oauths, :user_id, :bigint
    change_column :events, :user_id, :bigint
    change_column :event_users, :event_id, :bigint
    change_column :event_users, :user_id, :bigint
  end

  def down
    # Warning: this operation will lock the table

    # primary keys
    change_column :users, :id, :int
    change_column :oauths, :id, :int
    change_column :roles, :id, :int
    change_column :profiles, :id, :int
    change_column :events, :id, :int
    change_column :event_users, :id, :int

    # foreign keys
    change_column :users_roles, :user_id, :int
    change_column :users_roles, :role_id, :int
    change_column :roles, :resource_id, :int
    change_column :profiles, :user_id, :int
    change_column :oauths, :user_id, :int
    change_column :events, :user_id, :int
    change_column :event_users, :event_id, :int
    change_column :event_users, :user_id, :int
  end
end
