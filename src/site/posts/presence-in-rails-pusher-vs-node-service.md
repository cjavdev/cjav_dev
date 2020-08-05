---
title: Solving presence in Rails Pusher vs. Node service
date: 2015-02-06
---

There you are, sipping a mocha, writing another Rails app. It has users, and you’d love it if those users could interact and have some deep meaningful realtime connection. What do you reach for? Pusher? Generally that’s my first go to for realtime stuff! Pusher is awesome. It’s a software as a service platform for adding realtime awesomeness to your
app. As you would expect there are libraries in every flavor so you can use Pusher from whatever crazy setup you’ve got.

In the past, I’ve dropped the pusher gem into Rails apps and [Wham](http://static.guim.co.uk/sys-images/Guardian/Pix/pictures/2013/8/23/1377275935060/Wham-008.jpg)! now I’m pushin realtime updates to my users from the server. If you’re curious how easy it is to get started with Pusher + Rails [this is it](https://pusher.com/docs/javascript_quick_start):

If you want to follow along at home, you can checkout the 736e3b861705
branch of [github.com/w1zeman1p/code_racer](https://github.com/w1zeman1p/code_racer).

Add the `pusher_rails` gem to the Gemfile, then copy and paste the initializer code they give you when you create an app on their site.

```ruby
# Gemfile
gem 'pusher_rails'

# config/initializers/pusher.rb
require 'pusher'
Pusher.url = "http://#{ some key they give you }@api.pusherapp.com/apps/#{ some app id they give you }";
Pusher.logger = Rails.logger
```

Initialize an instance of a `Pusher` object in javascript somewhere.
(This is also how you might setup logging).

```js
// app/assets/javascripts/application.js
Pusher.log = function (message) {
  if (window.console &amp;&amp; window.console.log) {
    window.console.log(message);
  }
};
var pusher = new Pusher("some key they give you");
```

That’s it. You’re now up and running and can subscribe to events that are being pushed to the client.

Wow, that was easy. Whats the catch? Where does it fall down? Great question! (Disclaimer: You can get more out of Pusher if you [pay $$](https://pusher.com/pricing), I’m interested in squeezing as much out of the free service as possible). ~~This is great if the client is just listening for updates, but as soon as you need clients to emit events to each other, or emit events back to the server, Pusher wants you to pay.~~ (Thanks @Phil Leggetter! The only limitation on free account is number of connections.) I completely understand, seems like a valid business model. That said, it’s surprisingly easy to get more realtime mileage if you extract that logic into a service.

Extract into a service you say…

To checkout the Node service that I extracted take a gander at: https://github.com/w1zeman1p/code_racer_rt (the juicy stuff is in lib/rooms.js)

Node.js is a great platform for and has many tools surrounding realtime communication [see socket.io and peer.js]. IMO, it’s got a beautiful evented architecture and great tools for managing tiny requests and streams efficiently.

Following the docs on socket.io was a great start to getting things running locally. Moving the client side logic to the javascript served from my Rails app and replacing all the client side references to localhost to with my heroku domain running the node app was enough to get going.

So what to change in Rails? I was able to strip out every single reference to Pusher, including the gem and initializer :). And then add a few lines requiring the socket.io-client library.

For me, the trick to getting everything to play nicely was setting up the socket.io connection from the client, then as soon as the first Rails page loaded, emitting a `register` event storing a hash of users by socket id in node. Essentially syncing the sessions.

One beauty of using socket.io is that you get presence (who’s online) just by storing this hash of users.

How did I arrive at this solution? Why move away from pusher and into Node? What was the smell/thing to look for that pushed me to make this huge change? Another great question! My presence implementation started to feel, um, hella hacky. Lets look at some code:

At some point I decided that users should be able to see who else is online (presence). I thought of a few ways to accomplish this, the first of which was to emit a `hello` event to all other people in the channel when the page loads. (I think you can do this with paid Pusher, I’m essentially building a toy, so that wasn’t an option).

Okay, option 2: I’ll send an xhr request when the page loads and post to a Rails endpoint (I called it /api/online_users). This was a pretty cool, but fragile solution. Here’s a couple commits with most of the code: w1zeman1p/code_racer/commit/f5e6abee69
w1zeman1p/code_racer/commit/c84e731e0423

The gist is that on document ready, send a POST, on before unload send a DELETE. Then have all clients bind to a channel called `presence` and when an OnlineUser resource is created, trigger that event and notify all users.

```js
// on document ready
$.ajax({
  url: '/api/online_user',
  type: 'POST',
  data: window.CURRENT_RACER
});

// cleanup stuff
function cleanup() {
  CodeRacer.pusher.disconnect();
  $.ajax({
    url: '/api/online_user',
    type: 'DELETE',
  });
}
$(window).on('beforeunload', function () {
  var x = cleanup();
  return x;
});

// bind all users to presence channel, and listen for add_user
CodeRacer.pusher = new Pusher(key);
CodeRacer.presence = CodeRacer.pusher.subscribe('presence');
CodeRacer.presence.bind('add_user', function (data) {
  console.log('User coming online:', data);
});
```

From the Rails side, one option is to store all these users that are online in the SQL database. I didn’t go down that path for fear that talking to the SQL db would be too slow (I didn’t do any perf testing here, might be worth a try).

I tried using the Rails cache, in production I used memcachier. This worked pretty well, until some users `beforeunload` DELETE never fired and they ended up sticking around. More code?

```ruby
# app/controllers/api/online_users_controller.rb
before_action :get_users
after_action :set_users

def create
  @users &lt;&lt; user_hash unless @users.include?(user_hash)
  Pusher['presence'].trigger('add_user', user_hash)
  render json: @users
end

def user_hash
  {
    id: current_user.id,
    nickname: current_user.nickname
  }
end

def get_users
  @users ||= Rails.cache.read('users') || Set.new
end

def set_users
  Rails.cache.write('users', @users.to_a)
end
# ...
```

Kinda hacky? Yeah, I thought so too. It all depends on the `beforeunload` event firing just right and actually completing the DELETE request perfectly to remove the user from the cache. I suppose I could poll… ew. gross. No thanks.

Option 3! Replace the online user resource completely with a node service. This was the winner. No Rails controller (talk about skinny ;)), No Rails cache, No $.ajax requests, all socket.io.

Here’s a jumpstart for getting some node code running socket.io and doing presence with `register` and `online_users` events. The idea here is that we’ll emit a `register` event from the client when the page loads, and we’ll listen for an `online_users` event for batch updates about who’s online (this could probably be more efficient if we just listened for add and remove rather than batch updating?).

```js
// Node application running in a seprate instance than the Rails server.
// app.js
var http = require('http'),
  static = require('node-static'),
  file = new static.Server('./public'),
  _ = require('lodash');

var server = http.createServer(function (req, res) {
  req.addListener('end', function () {
    file.serve(req, res);
  }).resume();
});

// process.env.PORT is for heroku <img draggable="false" role="img" class="emoji" alt="🙂" src="https://s0.wp.com/wp-content/mu-plugins/wpcom-smileys/twemoji/2/svg/1f642.svg" scale="0">
server.listen(process.env.PORT || 8000);
var io = require('socket.io')(server);
var users = {};

io.on('connection', function (socket) {
  socket.on('register', function (data) {
    users[socket.id] = data;
    io.sockets.emit('online_users', _.values(users));
  });

  socket.on('disconnect', function () {
    delete users[socket.id];
    io.sockets.emit('online_users', _.values(users));
  });
});
```

Now that we’ve fired up a node app and we’re listening for connections, lets see the code we’ll need from the client.

```js
// app/assets/javascripts/application.js
var socket = io('http://mynodeapp.herokuapp.com');
socket.on('online_users', function (data) {
  console.log('online users: ', data);
});
// on document ready
socket.emit('register', window.CURRENT_RACER);
```

Where can we go from here? What incredible powers does this give us? Peer to peer! A feature I’d love to add is voice/video of the racers, see that look of focus and determination…

as the type as fast as possible :). Seems like a pretty reasonable feature to add with peer.js using Web RTC.
