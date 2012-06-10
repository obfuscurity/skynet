
class NilClass
  def method_missing(name, *args, &block)
  end
end

class Sequel::Model
end

class Worker < Sequel::Model

  many_to_one :jobs
  
  plugin :boolean_readers
  plugin :prepared_statements
  plugin :prepared_statements_safe
  plugin :validation_helpers

  def before_create
    super
    self.created_at = Time.now
    self.updated_at = Time.now
  end
end
