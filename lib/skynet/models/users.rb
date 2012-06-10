require 'rfc822'

class NilClass
  def method_missing(name, *args, &block)
  end
end

class Sequel::Model
  def validates_email_format(input)
    errors.add(:email, 'must be RFC822 compliant') unless input.is_email?
  end
  def validates_password_complexity(input)
    errors.add(:password, 'must be at least 4 chars long') unless input.length >= 4
  end
end

class User < Sequel::Model

  one_to_many :jobs
  
  plugin :boolean_readers
  plugin :prepared_statements
  plugin :prepared_statements_safe
  plugin :validation_helpers

  def before_validation
    super
  end

  def validate
    super
    validates_presence :email
    validates_email_format self.email
    validates_presence :password
    validates_password_complexity self.password
  end

  def destroy
    puts "#{self.email} called for a destroy, craaazy"
  end
end
