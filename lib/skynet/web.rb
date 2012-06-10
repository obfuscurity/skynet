require 'sinatra'
require 'json'

require 'skynet/config'
require 'skynet/models/all'

module Skynet
  class Web < Sinatra::Base

    configure do
      enable :logging
      enable :method_override
      disable :raise_errors if ENV['RACK_ENV'].eql?("production")
      disable :show_exceptions if ENV['RACK_ENV'].eql?("production")
    end

    before do
    end

    error do
      e = request.env['sinatra.error']
      p e.message.split(',').first
    end

    helpers do
    end

    get '/jobs/:id/status' do
      Tasks.filter(:job_id => param[:id]).to_json
    end

    get '/jobs' do
      Jobs.all.to_json
    end

    post '/jobs' do
      @job = Jobs.new(params).save
      @job.to_json
    end

