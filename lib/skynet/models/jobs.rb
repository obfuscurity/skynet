require 'resque'
require 'skynet/config'
require 'rest_client'

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

  Resque.redis = Config.redistogo_url

  def before_create
    super
    self.created_at = Time.now
    self.updated_at = Time.now
  end

  def after_create
    super
    Resque.enqueue(Worker::Scale, self.nodes)
  end
end

module Worker
  module Scale
    extend self

    def perform(nodes)
      RestClient.post(Config.heroku_api_scaling_url, :type => 'worker', :qty  => nodes)
    end
  end
end

