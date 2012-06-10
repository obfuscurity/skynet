require 'sequel'

db = ENV['DATABASE_URL'] || 'postgres://localhost/skynet'
Sequel.connect(db)

$LOAD_PATH.unshift File.dirname(__FILE__)
require 'users'
require 'jobs'
require 'workers'
