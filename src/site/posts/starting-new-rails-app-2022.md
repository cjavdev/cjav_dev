---
title: Rails with payments, auth, esbuild, and tailwind in 2022
date: 2022-01-05
---

Rails 7 includes several nice features for getting started, here are the steps
I follow to setup a new Rails application in 2022 for a demo application that
will:

* Authenticate users
* Accept payments
* Send emails


## Rails new

There are several new options for getting started with a basic rails app. Right
now, Tailwind CSS and esbuild are common and I prefer those defaults.

```bash
rails new pay-rails-demo -j esbuild -c tailwind -d postgresql -T --main
cd pay-rails-demo
```

1. `rails new pay-rails-demo` Creates a new rails application called `pay-rails-demo`
2. `-j esbuild` Sets the JavaScript build tool to [`esbuild`](https://github.com/evanw/esbuild) (this requires a little config, stay tuned)
3. `-c tailwind` Sets the CSS framework to Tailwind
4. `-d postgresql` Sets [Postgres](https://www.postgresql.org/) as the database
5. `-T` Skips setting up tests (I prefer rspec over the default minitest)
6. `--main` Sets the git branch name to `main` [instead of the default `master`](https://www.zdnet.com/article/github-to-replace-master-with-alternative-term-to-avoid-slavery-references/)

### Install dependencies

#### Ruby gems

```shell
bundle add letter_opener -g development
bundle add resque
bundle add pay
bundle add stripe
bundle add devise
```

1. `letter_opener` easily view emails in development
2. `resque` background job gem
3. `pay` the payments engine
4. `stripe` the payments provider we'll use with `pay`
5. `devise` the authentication engine


#### Node modules

First, I explicitly set the node version I want to use (I'm rocking `16.13.1`), then install dependencies.

```shell
nodenv local 16.13.1
npm i esbuild-rails esbuild-darwin-arm64
```

1. `esbuild-rails` [Chris Oliver's](https://twitter.com/excid3) [`esbuild-rails`](https://github.com/excid3/esbuild-rails)
2. `esbuild-darwin-arm64` Required if running on M1 Mac.


### Finish setting up JavaScript tools

#### esbuild


Create `esbuild.config.js` in the root of the project:

```javascript
// esbuild.config.js

const path = require('path')
const rails = require('esbuild-rails')

require("esbuild").build({
  entryPoints: ["application.js"],
  bundle: true,
  outdir: path.join(process.cwd(), "app/assets/builds"),
  absWorkingDir: path.join(process.cwd(), "app/javascript"),
  watch: process.argv.includes("--watch"),
  plugins: [rails()],
}).catch(() => process.exit(1))
```

#### Build scripts

Next, we need to setup the npm scripts for building. I manually update
`package.json` with the scripts like this (we still need to create
`esbuild.config.js`, but stick with me we'll do that in a sec):

```javascript
"scripts": {
  "build:css": "tailwindcss -i ./app/assets/stylesheets/application.tailwind.css -o ./app/assets/builds/application.css",
  "build": "node esbuild.config.js"
}
```

#### Dev runner

In even the most trivial Rails apps these days, we need to run a lot of
different tools at once: JS build pipeline, CSS pipeline, background job
worker, web worker etc. In Rails 7, there's a built in
[`Procfile.dev`](https://devcenter.heroku.com/articles/procfile) that by
default uses `foreman`, but [many other folks prefer using
`overmind`](https://twitter.com/cjav_dev/status/1476297692334608384)

At the end of the day, the goal is to be able to run `bin/dev` and all the required
tools are started. Here's how I setup my `Procfile.dev`:

```yml
web: bin/rails server -p 3000
js: yarn build --watch
css: yarn build:css --watch
stripe: stripe listen --forward-to localhost:3000/pay/webhooks/stripe -c localhost:3000/pay/webhooks/stripe
jobs: QUEUE=* rake resque:work
```

1. `stripe` starts the Stripe CLI's `listen` that will forward events from Stripe to your local running web server.
2. `jobs` starts the background job processor

**Note**: I also manually start `redis-server` and have that running in the
background all the time. It can be handy to run `resque-web` to see a UI for
interacting with jobs, too.

Once the following setup steps are complete you should be able to run `bin/dev` to get the server up and running.

### Finish setting up Rails config

#### Setup Action Mailer and Active Job config

Edit `config/environments/development.rb` and set the following:

```ruby
# config/environments/development.rb
# Mailers
config.action_mailer.default_url_options = { host: 'localhost', port: 3000 }
config.action_mailer.delivery_method = :letter_opener
config.action_mailer.perform_deliveries = true

# Jobs
config.active_job.queue_adapter = :resque
```

1. `action_mailer.default_url_options` enable fully qualified URLs
2. `action_mailer.delivery_method` use letter opener in development
3. `action_mailer.perform_deliveries` actually show the email
4. `active_job.queue_adapter` I like to use `resque` as my background job queue


#### Create the database

We need to create the database before we can run any migrations or write any data.

```shell
bin/rails db:create
```

#### Credentials

Setting up API keys for Stripe. Find the API keys in [the dashboard](https://dashboard.stripe.com/test/apikeys).

Then print the webhook signing secret from the [Stripe CLI](https://stripe.com/docs/stripe-cli) and set that as the signing secret:

```shell
stripe listen --print-secret
```

```shell
bin/rails credentials:edit --environment development
```

```yaml
stripe:
  public_key: pk_test_...
  private_key: sk_test_...
  signing_secret:
  - whsec_...
```


#### Create a User model

Both `pay` (payments wrapper) and `devise` (authentication) require some sort
of concept of a User, Account, or Team. I usually start very simply with an
empty User model:

```shell
bin/rails g model User
```

#### Create a root controller

```shell
bin/rails g controller StaticPages root
```

Update `config/routes.rb` to set the root route:

```rb
root to: "static_pages#root"
```

## Add authentication

You can follow the [`devise` instructions](https://github.com/heartcombo/devise#starting-with-rails). Here's what I do:

```shell
bin/rails generate devise:install
bin/rails generate devise User
bin/rails generate devise:views
```

Edit the migration created by the `devise` generator (`db/migrate/*_add_devise_to_users.rb`) to uncomment the `trackable` features.

```rb
## Trackable
t.integer  :sign_in_count, default: 0, null: false
t.datetime :current_sign_in_at
t.datetime :last_sign_in_at
t.string   :current_sign_in_ip
t.string   :last_sign_in_ip
```

Edit the user model to add `trackable`

```rb
class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :trackable
  # ...
```

Run the migrations:

```shell
bin/rails db:migrate
```

Now we can add `before_action :authenticate_user!` to controllers where we want to ensure a user is authenticated.

To see any error messages, we'll also want to put these view snippets somewhere, likely `application.html.erb`

```html
<p class="notice"><%= notice %></p>
<p class="alert"><%= alert %></p>
```

In order to get Devise to [play nicely with Rails
7](https://github.com/heartcombo/devise/issues/5439), I update the initializer
and add this line:

```rb
# config/initializers/devise.rb
config.navigational_formats = ['*/*', :html, :turbo_stream]
```

I also like to be able to logout via a GET request to `/users/sign_out` so I add:

```rb
config.sign_out_via = :get
```


## Add `Pay`

First, we need to copy and run the migrations for `pay`:

```shell
bin/rails pay:install:migrations
bin/rails db:migrate
```

Then, we'll generate views for `pay` so that we can customize the email copy to our liking:

```shell
bin/rails generate pay:views
bin/rails generate pay:email_views
```

Next, we'll update the `User` model, adding `pay_customer`, which gives users special billable powers:

```rb
class User < ApplicationRecord
  pay_customer
  # ...
```

Because we're using `trackable`, the User model will be updated at least every
time the user logs in or out. This enables us to setup hooks on the User model
that we can use to automate the creation of the related payment objects, namely
the Stripe Customer object.

To ensure the Stripe customer is created for every user, I add this after commit hook:

```rb
after_commit :maybe_set_payment_processor

def maybe_set_payment_processor
  if self.pay_customers.empty?
    set_payment_processor(:stripe)
  end
end
```

Setting the processor will create the database models, but will not actually
make the API call to create the Stripe Customer until the first time the
customer's ID is needed, lazily creating the customer JIT.


From here, we can either setup one-time or recurring payments and pay handles
emailing the customer, handling webhooks, and ensuring data is synced.
