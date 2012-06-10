
class NilClass
  def method_missing(name, *args, &block)
  end
end

class Sequel::Model
end

class Job < Sequel::Model

  many_to_one :users
  one_to_many :tasks
  
  plugin :boolean_readers
  plugin :prepared_statements
  plugin :prepared_statements_safe
  plugin :validation_helpers

  def before_validation
    super
  end

  def validate
    super
  end
end
