# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 2023_02_27_134622) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.bigint "byte_size", null: false
    t.string "checksum", null: false
    t.datetime "created_at", null: false
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "event_users", force: :cascade do |t|
    t.bigint "event_id"
    t.bigint "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "paid", default: false
    t.boolean "arrival", default: false
    t.string "remark"
    t.index ["event_id", "user_id"], name: "index_event_users_on_event_id_and_user_id", unique: true
    t.index ["event_id"], name: "index_event_users_on_event_id"
    t.index ["user_id"], name: "index_event_users_on_user_id"
  end

  create_table "events", force: :cascade do |t|
    t.string "name"
    t.string "description"
    t.text "content"
    t.integer "max_sign_up_number"
    t.integer "min_sign_up_number"
    t.datetime "sign_up_begin"
    t.datetime "sign_up_end"
    t.datetime "start"
    t.datetime "over"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.integer "participants_count", default: 0
    t.integer "registery_fee", default: 0
    t.boolean "check_arrival", default: false
    t.boolean "show_participants", default: true
    t.index ["check_arrival"], name: "index_events_on_check_arrival"
    t.index ["name"], name: "index_events_on_name"
    t.index ["over"], name: "index_events_on_over"
    t.index ["sign_up_begin"], name: "index_events_on_sign_up_begin"
    t.index ["sign_up_end"], name: "index_events_on_sign_up_end"
    t.index ["start"], name: "index_events_on_start"
  end

  create_table "group_reports", force: :cascade do |t|
    t.integer "adults_count", default: 0
    t.integer "children_count", default: 0
    t.integer "dedication", default: 0
    t.datetime "next_meeting_time"
    t.string "next_meeting_place"
    t.bigint "group_id"
    t.bigint "creater_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "meeting_time"
    t.string "meeting_place"
    t.index ["creater_id"], name: "index_group_reports_on_creater_id"
    t.index ["group_id"], name: "index_group_reports_on_group_id"
  end

  create_table "group_users", force: :cascade do |t|
    t.bigint "group_id"
    t.bigint "user_id"
    t.bigint "role_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["group_id"], name: "index_group_users_on_group_id"
    t.index ["role_id"], name: "index_group_users_on_role_id"
    t.index ["user_id"], name: "index_group_users_on_user_id"
  end

  create_table "groups", force: :cascade do |t|
    t.string "name"
    t.bigint "creater_id"
    t.string "introduction"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "members_count", default: 0
    t.integer "reports_count", default: 0
    t.integer "sequence"
    t.index ["creater_id"], name: "index_groups_on_creater_id"
    t.index ["sequence"], name: "index_groups_on_sequence"
  end

  create_table "messengers", force: :cascade do |t|
    t.string "provider"
    t.string "uid"
    t.boolean "activated", default: false
    t.bigint "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["activated"], name: "index_messengers_on_activated"
    t.index ["provider", "uid"], name: "index_messengers_on_provider_and_uid", unique: true
    t.index ["user_id"], name: "index_messengers_on_user_id"
  end

  create_table "oauths", force: :cascade do |t|
    t.bigint "user_id"
    t.string "provider"
    t.string "uid"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "token"
    t.index ["provider", "uid"], name: "index_oauths_on_provider_and_uid", unique: true
    t.index ["user_id"], name: "index_oauths_on_user_id"
  end

  create_table "profiles", force: :cascade do |t|
    t.string "name"
    t.string "sex"
    t.date "birth"
    t.string "phone"
    t.string "cellphone"
    t.string "address"
    t.string "education"
    t.bigint "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "id_number"
    t.string "emergency_contact"
    t.index ["birth"], name: "index_profiles_on_birth"
    t.index ["user_id"], name: "index_profiles_on_user_id"
  end

  create_table "roles", force: :cascade do |t|
    t.string "name"
    t.bigint "resource_id"
    t.string "resource_type"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.index ["name", "resource_type", "resource_id"], name: "index_roles_on_name_and_resource_type_and_resource_id"
    t.index ["name"], name: "index_roles_on_name"
  end

  create_table "subscriptions", force: :cascade do |t|
    t.boolean "new_events", default: false
    t.boolean "joined_events", default: true
    t.bigint "user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["joined_events"], name: "index_subscriptions_on_joined_events"
    t.index ["new_events"], name: "index_subscriptions_on_new_events"
    t.index ["user_id"], name: "index_subscriptions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.datetime "confirmation_sent_at"
    t.string "unconfirmed_email"
    t.string "auth_token"
    t.datetime "auth_token_sent_at"
    t.index ["auth_token"], name: "index_users_on_auth_token", unique: true
    t.index ["confirmation_token"], name: "index_users_on_confirmation_token", unique: true
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  create_table "users_roles", id: false, force: :cascade do |t|
    t.bigint "user_id"
    t.bigint "role_id"
    t.index ["user_id", "role_id"], name: "index_users_roles_on_user_id_and_role_id"
  end

  create_table "weeklies", force: :cascade do |t|
    t.string "title"
    t.integer "issue"
    t.datetime "published_at"
    t.datetime "created_at", precision: 6, null: false
    t.datetime "updated_at", precision: 6, null: false
    t.integer "viewed_count", default: 0
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "group_reports", "groups"
  add_foreign_key "group_reports", "users", column: "creater_id"
  add_foreign_key "group_users", "groups"
  add_foreign_key "group_users", "roles"
  add_foreign_key "group_users", "users"
  add_foreign_key "groups", "users", column: "creater_id"
  add_foreign_key "messengers", "users"
  add_foreign_key "oauths", "users"
  add_foreign_key "profiles", "users"
  add_foreign_key "subscriptions", "users"
end
