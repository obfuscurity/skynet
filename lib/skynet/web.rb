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

    get '/users/:user_id/jobs/:job_id/status' do
      Tasks.filter(:user_id => params[:user_id], :job_id => param[:id]).to_json
    end

    get '/users/:user_id/jobs' do
      Jobs.filter(:user_id => params[:user_id]).to_json
    end

    post '/users/:user_id/jobs' do
      @job = Jobs.new(params).save
      @job.to_json
    end

