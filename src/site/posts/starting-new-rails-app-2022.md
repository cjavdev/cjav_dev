---
title: Rails with payments, auth, esbuild, and tailwind in 2022
date: 2022-01-05
---

**Updated 2022-06-02**

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

#### NPM modules

```bash
npm i esbuild-darwin-arm64
```

#### Ruby gems

```shell
bundle add letter_opener -g development
bundle add sidekiq
bundle add stripe
bundle add devise
bundle add pay
```

1. `letter_opener` easily view emails in development
2. `sidekiq` background job gem
3. `stripe` the payments provider we'll use with `pay`
4. `devise` the authentication engine
5. `pay` the payments engine


#### Node modules

First, I explicitly set the node version I want to use (I'm rocking `16.13.1`), then install dependencies.

```shell
nodenv local 16.13.1
```

#### Build scripts

Next, we need to setup the npm scripts for building. I manually update
`package.json` with the scripts like this:

```javascript
"scripts": {
  "build": "esbuild app/javascript/*.* --bundle --sourcemap --outdir=app/assets/builds",
  "build:css": "tailwindcss -i ./app/assets/stylesheets/application.tailwind.css -o ./app/assets/builds/application.css --minify"
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
jobs: bundle exec sidekiq
```

1. `stripe` starts the Stripe CLI's `listen` that will forward events from Stripe to your local running web server.
2. `jobs` starts the background job processor

**Note**: I also manually start `redis-server` and have that running in the
background all the time.

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
config.active_job.queue_adapter = :sidekiq
```

1. `action_mailer.default_url_options` enable fully qualified URLs
2. `action_mailer.delivery_method` use letter opener in development
3. `action_mailer.perform_deliveries` actually show the email
4. `active_job.queue_adapter` I like to use `sidekiq` as my background job queue


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

Once these API keys are set, we can create an initializer for Stripe and set the API key:

```rb
# config/initializers/stripe.rb

Stripe.api_key = Rails.application.credentials.dig(:stripe, :private_key)
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
  pay_customer(
    default_payment_processor: :stripe,
    stripe_attributes: :stripe_attributes
  )

  def stripe_attributes(pay_customer)
    attrs = {
      metadata: {
        pay_customer_id: pay_customer.id,
        user_id: id # or pay_customer.owner_id
      }
    }

    if Rails.env.development?
      attrs[:test_clock] = Stripe::TestHelpers::TestClock.create(
        frozen_time: Time.now.to_i
      )
    end

    attrs
  end
```

Setting the default processor will create the database models, but will not
actually make the API call to create the Stripe Customer until the first time
the customer's ID is needed, lazily creating the customer JIT.

From here, we can either setup one-time or recurring payments and pay handles
emailing the customer, handling webhooks, and ensuring data is synced.


All at once:

```bash
rails new myapp -j esbuild -c tailwind -d postgresql -T --main
cd myapp

nodenv local 16.13.1
npm i esbuild-darwin-64

bundle add letter_opener -g development

bundle add stripe
tee config/initializers/stripe.rb <<EOF
Stripe.api_key = Rails.application.credentials.dig(:stripe, :private_key)
EOF

bundle add sidekiq
tee Procfile.dev <<EOF
web: bin/rails server -p 3000
js: yarn build --watch
css: yarn build:css --watch
stripe: stripe listen --forward-to localhost:3000/pay/webhooks/stripe -c localhost:3000/pay/webhooks/stripe
jobs: bundle exec sidekiq
EOF

bundle add devise
bundle add pay

tee config/routes.rb <<EOF
Rails.application.routes.draw do
  root to: "static_pages#root"
  get '/pricing', to: 'static_pages#pricing'
end
EOF

bin/rails db:create
bin/rails g model User
bin/rails g controller StaticPages root pricing
bin/rails generate devise:install
bin/rails generate devise User
bin/rails generate devise:views

```

Edit devise migration to enable trackable.


```bash
bin/rails pay:install:migrations
bin/rails db:migrate
bin/rails generate pay:views
bin/rails generate pay:email_views
```

Update `package.json`

```javascript
"scripts": {
  "build": "esbuild app/javascript/*.* --bundle --sourcemap --outdir=app/assets/builds",
  "build:css": "tailwindcss -i ./app/assets/stylesheets/application.tailwind.css -o ./app/assets/builds/application.css --minify"
}
```

Update `config/development.rb`

```ruby
# Mailers
config.action_mailer.default_url_options = { host: 'localhost', port: 3000 }
config.action_mailer.delivery_method = :letter_opener
config.action_mailer.perform_deliveries = true

# Jobs
config.active_job.queue_adapter = :sidekiq
```

Update `config/initializers/devise.rb`

```ruby
config.navigational_formats = ['*/*', :html, :turbo_stream]
config.sign_out_via = :get
```
