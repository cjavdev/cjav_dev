---
title: Rails edge case solved with middleware
date: 2015-02-16
---

Recently I was working with a friend, [@sidho](https://github.com/sidho) on an interesting problem. Sid built this [awesome app](http://beerpeer.herokuapp.com/) for tracking beers. It’s a Rails app that pulls some stuff from a [brewery API](http://www.brewerydb.com/developers/docs). He setup a webhook and was receiving updates from the API. Problem was: **_the data posted to the webhook included the key “action”_** which was used to denote what type of change was happening. By default, when a request is routed, Rails sets the key “action” to the controller action name and the key “controller” to the name of the controller. I spent a little time searching, and looked at the source for about 20 min before deciding the best solution would be to some how intercept the params, rename the key action to something else and then let Rails do its thing.

Here’s our first ever Rack middleware and it’s only job is to rename an incoming param with the name “action” to “beer_db_action”.

```ruby
# lib/params_fixer.rb
class ParamsFixer
  def initialize(app)
    @app = app
  end

  def call(env)
    request = Rack::Request.new(env)
    if request.params['action']
      request.update_param('beer_db_action', request.params['action'])
    end
    status, headers, resp = @app.call(env)
    [status, headers, resp]
  end
end

# config/application.rb
config.autoload_paths += Dir["#{config.root}/lib/**/"]
config.middleware.use "ParamsFixer"
```

Checkout [our solution](https://github.com/cjavdev/action_demo/) if you’re interested 🙂

I’m hoping to write a pull request for the gem/make a Rails version of the gem.
