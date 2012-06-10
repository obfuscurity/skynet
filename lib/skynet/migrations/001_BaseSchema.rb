
Sequel.migration do
  up do
    create_table(:users) do
      primary_key :id
      String      :email,         :size => 60, :null => false, :unique => true
      String      :password,      :size => 80, :null => false
      DateTime    :created_at,                 :null => false
      DateTime    :updated_at,                 :null => false
    end

    create_table(:jobs) do
      primary_key :id
      Integer     :nodes,                      :null => false
      String      :mapper_code,                                :text => true
      String      :reducer_code,                               :text => true
      String      :data_url,                                   :text => true
      DateTime    :created_at,                 :null => false
      DateTime    :updated_at,                 :null => false
      foreign_key :user_id, :users
    end

    create_table(:workers) do
      primary_key :id
      String      :uuid,          :size => 36, :null => false, :unique => true
      String      :type,          :size => 20, :null => false
      String      :state,         :size => 20, :null => false
      Integer     :progress,                   :null => false
      DateTime    :created_at,                 :null => false
      DateTime    :updated_at,                 :null => false
      foreign_key :job_id, :jobs
    end
  end

  down do
    drop_table(:workers, :jobs, :users, :cascade => true)
  end
end

