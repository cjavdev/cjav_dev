---
title: Finding and killing running web servers
date: 2021-02-18
---

I've had to look this up a few times, so thought it might be helpful to write down my solution, at least on Mac.

When you start a webserver the process will start listening and bind to a specific port. Sometimes, we'll start
a webserver in a terminal or from an IDE then close the terminal or close the IDE and lose the ability to kill
a given process. This is annoying because when you go to start a server on the same port you'll get an error like:


```
❯ ruby server.rb
/Users/me/.rbenv/versions/2.6.3/lib/ruby/gems/2.6.0/gems/thin-2.2.16.stripe/lib/thin/server.rb:104: warning: constant ::Fixnum is deprecated
== Sinatra (v2.1.0) has taken the stage on 4242 for development with backup from Thin
>> Thin web server (v1.2.8 codename Does It Offend You, Yeah?)
>> Maximum connections set to 65536
>> Listening on localhost:4242, CTRL+C to stop
>> Stopping ...
== Sinatra has ended his set (crowd applauds)
Traceback (most recent call last):
        11: from /Users/me/.rbenv/versions/2.6.3/lib/ruby/gems/2.6.0/gems/sinatra-2.1.0/lib/sinatra/main.rb:45:in `block in <module:Sinatra>'
        10: from /Users/me/.rbenv/versions/2.6.3/lib/ruby/gems/2.6.0/gems/sinatra-2.1.0/lib/sinatra/base.rb:1499:in `run!'
         9: from /Users/me/.rbenv/versions/2.6.3/lib/ruby/gems/2.6.0/gems/sinatra-2.1.0/lib/sinatra/base.rb:1565:in `start_server'
         8: from /Users/me/.rbenv/versions/2.6.3/lib/ruby/gems/2.6.0/gems/rack-2.2.3/lib/rack/handler/thin.rb:22:in `run'
         7: from /Users/me/.rbenv/versions/2.6.3/lib/ruby/gems/2.6.0/gems/thin-2.2.16.stripe/lib/thin/server.rb:159:in `start'
         6: from /Users/me/.rbenv/versions/2.6.3/lib/ruby/gems/2.6.0/gems/thin-2.2.16.stripe/lib/thin/backends/base.rb:71:in `start'
         5: from /Users/me/.rbenv/versions/2.6.3/lib/ruby/gems/2.6.0/gems/eventmachine-1.2.7/lib/eventmachine.rb:195:in `run'
         4: from /Users/me/.rbenv/versions/2.6.3/lib/ruby/gems/2.6.0/gems/eventmachine-1.2.7/lib/eventmachine.rb:195:in `run_machine'
         3: from /Users/me/.rbenv/versions/2.6.3/lib/ruby/gems/2.6.0/gems/thin-2.2.16.stripe/lib/thin/backends/base.rb:63:in `block in start'
         2: from /Users/me/.rbenv/versions/2.6.3/lib/ruby/gems/2.6.0/gems/thin-2.2.16.stripe/lib/thin/backends/tcp_server.rb:16:in `connect'
         1: from /Users/me/.rbenv/versions/2.6.3/lib/ruby/gems/2.6.0/gems/eventmachine-1.2.7/lib/eventmachine.rb:531:in `start_server'
/Users/me/.rbenv/versions/2.6.3/lib/ruby/gems/2.6.0/gems/eventmachine-1.2.7/lib/eventmachine.rb:531:in `start_tcp_server': no acceptor (port is in use or requires root privileges) (RuntimeError)
```

After a short time debugging, I always land on this [StackOverflow
post](https://stackoverflow.com/questions/3855127/find-and-kill-process-locking-port-3000-on-mac) which shows
how to use `lsof` on mac which lists open files.

Passing `-i tcp:3000` where 3000 is the port that the server was started on will filter the output to the
running webserver process that is listening on port 3000.

Once you've found the running process with `lsof -i tcp:4242`:

```
❯ lsof -i tcp:4242
COMMAND   PID     USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME
ruby    53769       me   19u  IPv6 0xae667db68e1c760f      0t0  TCP localhost:4242 (LISTEN)
```

You can kill the process with `kill -9 <pid>` in this case:

```
kill -9 53769
```

Which stops the process and allows you to again try restarting your server.
