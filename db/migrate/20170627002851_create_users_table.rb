class CreateUsersTable < ActiveRecord::Migration[5.1]
  def change
    create_table :users_tables do |t|
      t.string :first_name
      t.string :last_name
      t.string :email
      t.string :phone_number
    end
  end
end
