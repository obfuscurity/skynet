module Skynet
  module Config
    def self.env!(key)
      ENV[key] || raise("missing #{key}")
    end

    def self.port; env!("PORT").to_i; end
    def self.heroku_api_scaling_url; env!("HEROKU_API_SCALING_URL"); end
    def self.rack_env; env!("RACK_ENV"); end
    def self.redistogo_url; env!("REDISTOGO_URL"); end
  end
end
