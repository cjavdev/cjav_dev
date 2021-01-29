---
title: stripe-perl Hello World
date: 2021-01-28
---

Someone was asking about how to use Stripe Checkout with perl and their
question piqued my interest. To date, Stripe hasn't supported an official
client library for working with the Stripe API from perl, however this
community library, [stripe-perl](https://github.com/lukec/stripe-perl) has been
working well for many users.

I wanted to see how hard it'd be to get up and running with the library
and in general with Perl, a language I hadn't written since ~2005.

Here's my friction log while getting started. Hopefully you'll find
it handy while trying to get up and running with.

The very first step was to get the `Net::Stripe` module installed and
a simple instance initialized with an API key.

```
#!/usr/bin/env perl
use Net::Stripe;
$API_KEY = '<this is my real api key like sk_test_xxxx>';
my $stripe = Net::Stripe->new(api_key => $API_KEY);
```

Was seeing this error:

```
malformed JSON string, neither array, object, number, string or atom, at character offset 0 (before "LWP will support htt...") at /usr/local/Cellar/perl/5.32.0/lib/perl5/site_perl/5.32.0/Net/Stripe.pm line 1319.
```

Initially, I assumed it was because I hadn't passed an API version because I
noticed in the backtrace a call to `_validate_api_version_range`.

So I set the API version like so:

```
#!/usr/bin/env perl
use Net::Stripe;
$API_KEY = '<this is my real api key like sk_test_xxxx>';
my $stripe = Net::Stripe->new(api_key => $API_KEY, api_version => '2020-03-02');
```

No dice!

After diving deeper with the perl debugger (pretty similar to byebug in ruby!)

Side note: I ran the perl debugger by starting the program with:

```sh
perl -d ./server.pl
```

Then use `s` to step into function calls and `n` to step over, `l` to list the
current line and `p $params` to print a variable. It might also be handy to
import the Dumper? (weird name, but k) like `use Data::Dumper;` then `p Dumper
$req`.

Which printed this puppy:

```
  DB<21> p Dumper $response
$VAR1 = bless( {
                 '_request' => bless( {
                                        '_headers' => bless( {
                                                               'stripe-version' => '2020-03-02',
                                                               '::std_case' => {
                                                                                 'stripe-version' => 'Stripe-Version'
                                                                               },
                                                               'user-agent' => 'Net::Stripe/0.42',
                                                               'authorization' => 'Basic <key>'
                                                             }, 'HTTP::Headers' ),
                                        '_content' => '',
                                        '_method' => 'GET',
                                        '_uri' => bless( do{\(my $o = 'https://api.stripe.com/v1/balance')}, 'URI::https' )
                                      }, 'HTTP::Request' ),
                 '_msg' => 'Protocol scheme \'https\' is not supported (LWP::Protocol::https not installed)',
                 '_content' => 'LWP will support https URLs if the LWP::Protocol::https module
```

See that `_msg` key? Seems to be caused by not having the LWP::Protocol::https module? I
resolved it by running:

```sh
cpanm LWP::Protocol::https
```

Okay now running `./server.pl` runs without error or output.

Seems like the client is now initialized correctly, so I wanted to make an API call to create a PaymentIntent and did so like this:

```pl
#!/usr/bin/env perl
use Net::Stripe;

$API_KEY = '***';
my $stripe = Net::Stripe->new(api_key => $API_KEY, api_version => '2020-03-02');
my $payment_intent = $stripe->create_payment_intent(  # Net::Stripe::PaymentIntent
    amount      => 1999,
    currency    => 'usd',
);
print $payment_intent->id;
```

Boom! I see a PaymentIntent ID in the terminal output.

Next, let's try to plop this API call into a simple webserver. I googled around
for common webservers in Perl and picked Mojolicious because it had the most
stars on GitHub. /shrug seems legit

I setup a super basic post endpoint like this:


```pl
#!/usr/bin/env perl
use Mojolicious::Lite -signatures;
use Net::Stripe;

app->secrets(['3ffb512774f4016864e20db1d567d36b']);

post '/create-payment-intent' => sub ($c) {
  my $stripe = Net::Stripe->new(api_key => 'sk_test_***');
  my $payment_intent = $stripe->create_payment_intent(  # Net::Stripe::Charge
      amount      => 1999,
      currency    => 'usd',
  );

  $c->render(json => {clientSecret => $payment_intent->client_secret});
};

app->start;
```

and start it with

```sh
./server.pl daemon
```

Poke at it with curl:

```
curl -X POST http://localhost:3000/create-payment-intent
```

Which returned:

```json
{"clientSecret":"pi_1IEmb2CZ6qsJgndJUlVaLGa3_secret_8jDyPCyJycJGki8sZoFPz5z6m"}
```

Wowza that was fun and I'm getting back the client secret for a PaymentIntent
that I can now confirm on a front end. (Perhaps another day, it's dinner time!)
