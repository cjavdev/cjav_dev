---
title: Push database to Heroku using Dropbox
date: 2015-03-31
---

One question I’m often asked is how to get started quickly in production with the data populated during development. Putting aside the fact that this is generally a bad idea. I’d like to discuss a few options and show you how I moved my 118GB postgres database to heroku.

One really great option, if you’ve got a reasonable amount of data, is to use the seed_dump gem. Filling out Seed files is often a pain. Especially if you’ve got a ton of complex data. That said, it’s extremely valuable when you have some predefined datasets that must be in the database before getting started. seed_dump is a tool that will export your current database into ruby statements that can be used in your seed.rb file. It works like this:

Add to Gemfile

```ruby
# Gemfile
gem 'seed_dump'
```

Run this to get the output

```bash
rake db:seed:dump
```

Another option when using postgres is to use [heroku’s import/export tools](https://devcenter.heroku.com/articles/heroku-postgres-import-export). In the documentation you’ll see that heroku recommends using AWS to store your database file. AWS is a good option especially for Heroku as they live in the same ecosystem. The easiest way for me to get my locally exported postgres database into heroku was actually via Dropbox. I simply put the compressed export into a Dropbox folder, copy the public link and use that as the basis for restoring.

Here are the steps you’ll need.

The -Fc flag here will compress the dump so that you aren’t given plaintext SQL statement output.

```bash
pg_dump -Fc --no-acl --no-owner -h localhost mydb > mydb.dump
mv mydb.dump ~/Dropbox/backups/
```

Wait a few hours for the file (~8GB in my case) to upload to Dropbox.

Once the file has been uploaded to Dropbox, you can right click and select share. The following dialog will contain a public link to the file.

IMPORTANT: The link shown has a query string of `?dl=0` change this to `?dl=1`

```bash
heroku pg:backups restore 'https://www.dropbox.com/s/somehash/mydb.dump?dl=1' DATABASE_URL
```

Hopefully this helps someone out there! 🙂
