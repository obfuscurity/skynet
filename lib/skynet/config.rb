module Skynet
  module Config
    def self.env!(key)
      ENV[key] || raise("missing #{key}")
    end

    def self.port; env!("PORT").to_i; end
  end
end
