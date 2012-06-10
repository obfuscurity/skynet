require 'sinatra'
require 'json'

require 'skynet/config'
require 'skynet/models/all'

module Skynet
  class Web < Sinatra::Base

    configure do
      enable :logging
      enable :method_override
      disable :raise_errors if Config.rack_env.eql?("production")
      disable :show_exceptions if Config.rack_env.eql?("production")
    end

    before do
    end

    error do
      e = request.env['sinatra.error']
      p e.message.split(',').first
    end

    helpers do
    end

    get '/users/:user_id/jobs' do
      @jobs = []
      Job.filter(:user_id => params[:user_id]).all.each {|j| @jobs << j.values}
      @jobs.to_json
    end

    post '/users/:user_id/jobs' do
      @job = Job.new(params).save
      @job.values.to_json
    end
  end
end

