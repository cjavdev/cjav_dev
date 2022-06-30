---
title: Stripe API from Airtable Scripts
date: 2022-06-30
---


Airtable is a popular tool for building no-code applications. I’m finding that
knowing just a little bit of JavaScript can really super charge these no-code
solutions. [Airtable Scripting](https://www.airtable.com/developers/scripting)
enables you to write a bit of custom JavaScript and wire that up with links and
buttons built into your Airtable base. While it’s possible to use tools like
[Zapier](https://zapier.com/apps/stripe/integrations) to wire up some basic API
calls to Stripe, it can be handy to know how to hit the API directly so you can
customize your workflows for your business.

Airtable’s scripting environment is not the full Node.js or browser
environment. Instead, it’s a custom environment for working within Airtable. It
exposes some helpful methods for working directly with the Airtable base and
some more primitive methods for making HTTP calls either client side or server
side.

Given we don’t have the full Node.js environment, we’re not able to use the
[stripe-node](https://github.com/stripe/stripe-node) client library. Instead,
we’ll need to construct requests with [form
encoded](https://en.wikipedia.org/wiki/POST_(HTTP)#Use_for_submitting_web_forms)
bodies and use Airtable Scripting’s
[`remoteFetchAsync`](https://www.airtable.com/developers/scripting/api/fetch#remote-fetch-async)
[](https://www.airtable.com/developers/scripting/api/fetch#remote-fetch-async)method
to avoid any blasted CORES problems.

For instance, here’s how you might create a Stripe Customer:


```javascript
remoteFetchAsync(`https://api.stripe.com/v1/customers`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer sk_test_ab23bca23bscab23bs`,
    'Content-Type': "application/x-www-form-urlencoded",
    'Accept': 'application/json',
    'User-Agent': 'Airtable tutorial cjav_dev/0.0.1'
  },
  body: 'email=wave@cjav.dev',
}).then(r => r.json()).then(customer => console.log(customer));
```

If you’ve used the browser’s `fetch` method, this will be familiar.

From the Airtable Scripting [docs](https://www.airtable.com/developers/scripting/api/fetch#differences-from-fetch-in-the-browser), we learn these notable differences from how fetch works in the browser:


<pre>
- The referrer and referrerPolicy options are not respected. A Referer header is never set.
- The follow redirect mode is not supported. Only error and manual are supported. As manual returns an 'opaque' response in order to respect atomic HTTP redirect handling, it's effectively impossible to follow redirects at present.
- Streaming responses and requests are not supported. The APIs exist and work as expected, but buffer under the hood.
- Caching is not supported. Cache modes can be set, but always behave like reload.
- Cookies are not supported. The credentials options can be set, but always behaves like omit.
- Different request modes are not supported. They can be set, but none will quite behave as expected. The closest mode in the standard is same-origin, except that requests can be made to any origin.
- Subresource integrity is not validated. The integrity metadata property can be set, but is ignored.
- The FormData API for request/response bodies is not supported.
- The response payload has a size limit of 4.5 MB.
</pre>

Those differences seem fine to me, so let’s talk about how we can improve the experience of writing these scripts when working with the Stripe API.

Perhaps you want to use the API to create a Product, then create a Price, then create a Payment Link for that new Price so that you can use Airtable’s other automations to Tweet or send as SMS.


## Form encoded bodies

[stripe-node](https://github.com/stripe/stripe-node) has this handy feature where we can pass it JavaScript objects and it’ll handle the form encoding before sending in the request body.

For example, when we say:


```javascript
stripe.customers.create({ email: "wave@cjav.dev", name: "CJ Avilla" })
```

the client library will translate the params to `email=wave@cjav.dev&name=CJ%20Avilla`

When params are top level, it’s pretty easy to manage by hand, but the Stripe API accepts some really complex arguments to really customize the experience for your users. For instance, it’s a little trickier to manually form encode this request body create a price:


```javascript
stripe.prices.create({
  unit_amount: 2800,
  currency: 'usd',
  recurring: {
    interval: 'month'
  },
  product_data: {
    name: 'Box subscription',
    metadata: {
      sku: 'abc123',
    },
    images: ['http://placekitten.com/200/300'],
  },
});
```

Instead, we’re going to use this bit of JavaScript that’ll handle most of the cases for us (I don’t remember the source of this example, so if you have the canonical source, let me know so I can link to it!):


```javascript
// Builds pairs of key and value params where the key is an array of strings representing
// the key path through the object.
// Example:
//   { a: 1 } => a=1
//   { a: { b: 1 }} => a[b]=1
//   { a: [1]} => a[]=1
//   { a: [1, 2]} => a[]=1&a[]=2
//   { a: {b: {c: 3}}} => a\[b\][c]=3
function buildParamPairs(params) {
  let pairs = [];
  Object.entries(params).forEach(([key, value]) => {
    let keys = [key];
    if (Array.isArray(value)) {
      value.forEach((val) => {
        if (Array.isArray(val)) {
          // Not needed for Stripe API patterns, skipping
        } else if (typeof val === "object") {
          let subPairs = buildParamPairs(val);
          subPairs.forEach(([_keys, value]) => {
            pairs.push([keys.concat('').concat(_keys), value]);
          });
        } else {
          pairs.push([keys.concat(''), val]);
        }
      });
    } else if (typeof value === "object") {
      let subPairs = buildParamPairs(value);
      subPairs.forEach(([_keys, value]) => {
        pairs.push([keys.concat(_keys), value])
      });
    } else {
      pairs.push([keys, value])
    }
  });
  return pairs;
}
function stringify(params) {
  let pairs = [], keyPath = '', bracketedKeys = '';
  buildParamPairs(params).forEach(([keys, value]) => {
    if(keys.length === 1) {
      keyPath = keys[0];
    } else {
      bracketedKeys = keys.slice(1, keys.length).map(k => `[${k}]`).join('');
      keyPath = `${keys[0]}${bracketedKeys}`
    }
    pairs.push(`${keyPath}=${value}`);
  })
  return pairs.join("&");
}
```

It’s a doozy, but it should handle most cases. 😵‍💫

Now we can update our API call to use this new `stringify` method so we can pass JavaScript objects instead of manually form encoding.

```javascript
remoteFetchAsync(`https://api.stripe.com/v1/customers`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer sk_test_ab23bca23bscab23bs`,
    'Content-Type': "application/x-www-form-urlencoded",
    'Accept': 'application/json',
    'User-Agent': 'Airtable tutorial cjav_dev/0.0.1'
  },
  body: stringify({
    email: 'wave@cjav.dev'
  }),
}).then(r => r.json()).then(customer => console.log(customer));
```



## Handling API keys

We don’t want to store our secret API key in the content of the script.
Ideally, we also create a [Restricted API
key](https://stripe.com/docs/development/dashboard/manage-api-keys#create-a-restricted-api-secret-key)
from the Stripe Dashboard so that it only has permission to perform exactly the
actions we need for the automation.

Instead of hardcoding the API key, let’s use Airtable Scripting’s
[`input.config`](https://www.airtable.com/developers/scripting/api/config#input-config)
to accept an API key as part of the script’s configuration:


```javascript
// Click the "gear" icon in the top right to view settings
const config = input.config({
    title: 'Your Stripe API Key',
    description: 'For making API calls to Stripe',
    items: [
        input.config.text('STRIPE_SECRET_KEY', {
            label: 'Stripe Secret Key',
            description: 'Enter an API key from your Stripe Dashboard: https://dashboard.stripe.com/test/apikeys',
        }),
    ]
});
console.log(config.STRIPE_SECRET_KEY)
```

This way, you have an input where you can drop your restricted API key.

<img src="/images/airtable-script.png" width="600" />


Now we can update our API call to use the API key from the config.


```javascript
remoteFetchAsync(`https://api.stripe.com/v1/customers`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${config.STRIPE_SECRET_KEY}`,
    'Content-Type': "application/x-www-form-urlencoded",
    'Accept': 'application/json',
    'User-Agent': 'Airtable tutorial cjav_dev/0.0.1'
  },
  body: stringify({
    email: 'wave@cjav.dev'
  }),
}).then(r => r.json()).then(customer => console.log(customer));
```

We still need to pass all these headers and the correct method each time. In my experience, it can be helpful to build out a little class that acts as a wrapper for this call.


## Airtable Stripe client

Here’s a basic example of a class that we can use to simplify our API calls by abstracting away the common headers and constructing the remoteFetchAsync call:


```javascript
class Stripe {
  API_BASE = "https://api.stripe.com";
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  async create(path, params, headers) {
    return this._request('POST', path, params, headers);
  }
  async retrieve(path, params, headers) {
    return this._request('GET', path, params, headers);
  }
  async _request(method, path, params, headers) {
    return remoteFetchAsync(
      `${this.API_BASE}${path}`, {
        method,
        headers: {...this.headers, ...headers},
        body: stringify(params),
      }
    ).then(r => r.json())
  }
  get headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': "application/x-www-form-urlencoded",
      'Accept': 'application/json',
      'User-Agent': 'AirtableScripting cmnc/0.0.1'
    };
  }
}
```
We’ll construct an instance of the Stripe wrapper:


```javascript
const stripe = new Stripe(config.STRIPE_SECRET_KEY);
```

Then our API call to create a customer looks like this 😍:


```javascript
stripe.create("/v1/customers", {
  email: 'wave@cjav.dev',
})
```

Here’s a full example of a script for creating a Price and a PaymentLink on the fly using the Stripe API from an Airtable Script:


```javascript
// Builds pairs of key and value params where the key is an array of strings representing
// the key path through the object.
// Example:
//   { a: 1 } => a=1
//   { a: { b: 1 }} => a[b]=1
//   { a: [1]} => a[]=1
//   { a: [1, 2]} => a[]=1&a[]=2
//   { a: {b: {c: 3}}} => a\[b\][c]=3
function buildParamPairs(params) {
  let pairs = [];
  Object.entries(params).forEach(([key, value]) => {
    let keys = [key];
    if (Array.isArray(value)) {
      value.forEach((val) => {
        if (Array.isArray(val)) {
          // Not needed for Stripe API patterns, skipping
        } else if (typeof val === "object") {
          let subPairs = buildParamPairs(val);
          subPairs.forEach(([_keys, value]) => {
            pairs.push([keys.concat('').concat(_keys), value]);
          });
        } else {
          pairs.push([keys.concat(''), val]);
        }
      });
    } else if (typeof value === "object") {
      let subPairs = buildParamPairs(value);
      subPairs.forEach(([_keys, value]) => {
        pairs.push([keys.concat(_keys), value])
      });
    } else {
      pairs.push([keys, value])
    }
  });
  return pairs;
}
function stringify(params) {
  let pairs = [], keyPath = '', bracketedKeys = '';
  buildParamPairs(params).forEach(([keys, value]) => {
    if(keys.length === 1) {
      keyPath = keys[0];
    } else {
      bracketedKeys = keys.slice(1, keys.length).map(k => `[${k}]`).join('');
      keyPath = `${keys[0]}${bracketedKeys}`
    }
    pairs.push(`${keyPath}=${value}`);
  })
  return pairs.join("&");
}
class Stripe {
  API_BASE = "https://api.stripe.com";
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  async create(path, params, headers) {
    return this._request('POST', path, params, headers);
  }
  async retrieve(path, params, headers) {
    return this._request('GET', path, params, headers);
  }
  async _request(method, path, params, headers) {
    return remoteFetchAsync(
      `${this.API_BASE}${path}`, {
        method,
        headers: {...this.headers, ...headers},
        body: stringify(params),
      }).then(r => r.json())
  }
  get headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': "application/x-www-form-urlencoded",
      'Accept': 'application/json',
      'User-Agent': 'AirtableScripting cmnc/0.0.1'
    };
  }
}
// Click the "gear" icon in the top right to view settings
const config = input.config({
  title: 'Your Stripe API Key',
  description: 'Used for making API calls to Stripe',
  items: [
    input.config.text('STRIPE_SECRET_KEY', {
      label: 'Stripe Secret Key',
      description: 'Enter an API key from your Stripe Dashboard: https://dashboard.stripe.com/test/apikeys',
    }),
  ]
});

// Example:
const stripe = new Stripe(config.STRIPE_SECRET_KEY);
// Find the current table and record:
const ordersTable = base.getTable(cursor.activeTableId)
const record = await input.recordAsync('Choose a record', ordersTable);
// Create a new Price
const price = await stripe.create("/v1/prices", {
  currency: 'usd',
  unit_amount: record.getCellValue("Amount") * 100,
  product_data: {
    name: 'Coaching session'
  }
})
// Create a new PaymentLink
const paymentLink = await stripe.create("/v1/payment_links", {
  line_items: [{
    price: price.id,
    quantity: 1
  }],
})
// Store the ID and URL of the PaymentLink
await ordersTable.updateRecordAsync(record, {
  'Payment Link ID': paymentLink.id,
  'Payment Link': paymentLink.url
});
```
