---
title: Handling Stripe Webhooks with Rails
date: 2022-02-17
---

This is mostly for my own reference later so I can
quickly copy and paste snippets.

First, I create a webhook controller:

```bash
rails g controller Webhooks
```

Then, configure the routes to accept POST requests

```rb
# config/routes.rb

resources :webhooks, only: [:create]
```

Then, I make sure to skip CSRF protection, which doesn't
make sense for webhooks.

```rb
# app/controllers/webhooks_controller.rb

class WebhooksController < ApplicationController
  skip_before_action :verify_authenticity_token

```

Next, I'll add a private method to fetch the webhook endpoint secret:

```rb
  private

  def endpoint_secret
    (Rails.application.credentials.dig(:stripe, :signing_secret) || []).first
  end
```

Then, I'll drop in this code which is a smiple getting
started, but ultimately I often need to expand to using
Jobs for processing.

```rb
  def create
    payload = request.body.read
    sig_header = request.env['HTTP_STRIPE_SIGNATURE']
    event = nil

    begin
      event = Stripe::Webhook.construct_event(
        payload, sig_header, endpoint_secret
      )
    rescue JSON::ParserError => e
      # Invalid payload
      render json: { error: { message: e.message }}, status: :bad_request
      return
    rescue Stripe::SignatureVerificationError => e
      # Invalid signature
      render json: { error: { message: e.message, extra: "Sig verification failed" }}, status: :bad_request
      return
    end

    # Handle the event
    case event.type
    when 'payment_intent.succeeded'
      payment_intent = event.data.object # contains a Stripe::PaymentIntent
      puts 'PaymentIntent was successful!'
    when 'payment_method.attached'
      payment_method = event.data.object # contains a Stripe::PaymentMethod
      puts 'PaymentMethod was attached to a Customer!'
      # ... handle other event types
    else
      puts "Unhandled event type: #{event.type}"
    end

    render json: { message: :success }
  end
```

To confirm the endpoint secret is set up correctly, edit the credentials:

```bash
EDITOR=vi rails credentials:edit
```

Confirm the yaml has something like this shape:

```yml
stripe:
  public_key: pk_test_456ghi
  private_key: sk_test_xyz789
  signing_secret:
  - whsec_abc123
```

I like to test and build webhooks with the Stripe CLI, so I'll print the secret
to confirm it's the one that I'll use with the `listen` command:

```bash
stripe listen --print-secret
```

In this case, it printed
`whsec_fd03884b23637875a5de75b850eaff56272adb133ce67d53d8c55e6d8bc77046` and
that will be the webhook signing secret used for the webhook endpoint created
by the Stripe CLI automatically when I run the `stripe listen` command.

I've started using `bin/dev` to start my rails apps recently. It can be helpful
to add a line to always start the webhook listener here too.

Here's what my Procfile.dev looks like:

```yml
web: bin/rails server -p 3000
js: yarn build --watch
css: yarn build:css --watch
stripe: stripe listen --forward-to localhost:3000/webhooks -c localhost:3000/webhooks
jobs: QUEUE=* rake resque:work
```

Now that the webhook is configured, I'll fire up the app:

```bash
bin/dev
```

Note that when the app starts, the output will also include the webhook signing secret, in case it wasn't printed earlier:

<img alt="screenshot of terminal with output showing signing secret" src="/images/signing-secret-printed.png" width="100%"/>

At this point, we can test to see if the webhook
endpoint is working using the Stripe CLI.

We should log out `PaymentIntent was successful!` when receiving a `payment_intent.succeeded` event.

With the `trigger` command in the Stripe CLI, we can cause that event to fire:

```bash
stripe trigger payment_intent.succeeded
```

I check the server log and confirm that I see that message printed and now I'm
ready to move onto app specific event handling logic.
