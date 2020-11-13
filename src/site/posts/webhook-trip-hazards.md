---
title: Webhook Trip Hazards
date: 2020-11-13
---

Want to read this the hard way? Enjoy as a [tweet thread](https://twitter.com/cjav_dev/status/1327326076683526145).

Want to watch a video instead? [Here's one](https://www.youtube.com/watch?v=oYSLhriIZaA) about handling Stripe Webhooks?

Sometimes, users ask why Stripe webhook signature verification fails. Here's a
list of the most common reasons we see and how to fix them 👇.

### Background context

First, some background. When Stripe sends webhook event notifications, the POST
request headers include a signature to prove the event came from Stripe.  You
can automatically verify signatures to trust the event's content vs.
retrieving it through the API. Here are the official docs showing how to
implement [signature verification](https://stripe.com/docs/webhooks/signatures)
with the client libraries.

### Different signing secret

The webhook signing secret used in the webhook handling code is not the same as
shown in your Stripe dashboard for that webhook endpoint.  Each webhook
endpoint configured in the dashboard or for the Stripe CLI has a unique signing
secret.

If you are using Stripe Connect, you'll likely have at least two webhook
endpoints, one for your account's events and one for connected accounts'
events. Each has a different signing secret, and the webhook handler might only
be using one.

### Modified payload

The payload in the webhook handler is different from the data Stripe signed.
Often, the web framework or a library tried to be helpful in middleware and may
have:

* parsed the body as JSON
* changed order of properties
* modified indentation

For signatures to match, the webhook handler must use the exact same string as
Stripe. Ensure you're working with the HTTP request's raw body without any
interference by the framework or any libraries.

For instance, [stripe-node](https://github.com/stripe/stripe-node) with
`bodyParser` override:

<img src="/images/stripe-node-webhook.png" width="600" alt="https://carbon.now.sh/AqUXy7XGQQdgxbpjl16v" />

Depending on the node framework, a workaround in [this
GitHub](https://github.com/stripe/stripe-node/issues/341) issue might also be
helpful.

The webhook handler's string encoding for the payload is not set to UTF-8. The
Stripe API treats all strings as UTF-8. The signature header is calculated from
a UTF-8 encoded string on the Stripe side. Enforce UTF-8 for that payload in
your webhook handler.

Using ASCII sometimes trips up folks working in PHP. Additionally, when working
with stripe-python you'll likely want to decode as utf-8:

<img src="/images/stripe-python-webhook.png" alt="https://carbon.now.sh/UFrXVLmvljQ39R25qikI" width="600" />

Handling webhooks with #AWS Lambda? You might need some custom logic to access the raw request body.

In API Gateway, set up a Body Mapping Template with Content-Type: application/json (just this – don't include `; charset=utf-8` afterwards):

<img src="/images/aws-lambda-webhook.png" alt="https://carbon.now.sh/ar8yXN77uSxCbXAA2Xjl" width="600" />

### Missing signature

The signature is not in the request headers. In an older implementation of webhook notifications, signatures weren't included in the request headers unless the endpoint's secret was revealed in the dashboard. Now, Stripe sends the signature headers for all event notifications.
