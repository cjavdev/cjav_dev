---
title: How I start Django apps in 2022
date: 2022-07-07
---

This is mostly a note to self about the steps for
setting up a fully operational django application
with tailwind, authentication, and payments.

## Scaffold the python environment

From some parent directory run:

```bash
python -m venv venv
so venv/bin/activate
```

Install django

```bash
pip install Django
```

## Create the django app

Note, the project name can't have dashes. Not sure why 🤷.

```bash
django-admin startproject proj
cd proj
python manage.py runserver
```

That should start the server running at [localhost:8000](http://localhost:8000).

```bash
mkdir -p templates/registration
touch templates/home.html templates/registration/{login,signup}.html
```

`home.html` will act as our landing page.

Update the `proj/urls.py` with:


```python
from django.contrib import admin
from django.urls import path, include
from django.views.generic.base import TemplateView

urlpatterns = [
    # ...
    path('', TemplateView.as_view(template_name='home.html'), name='home'),
]
```

## Setup Tailwind

Mostly follow [this guide](https://django-tailwind.readthedocs.io/en/latest/installation.html).

Adding again here because some stuff tripped me up.

```bash
python -m pip install django-tailwind
```

Update `proj/settings.py`:

```python
INSTALLED_APPS = [
  # other Django apps
  'tailwind',
]
# ...
TEMPLATES = [
    {
        'DIRS': [ BASE_DIR / 'templates' ],
         # ...
    }
]
```

Then run and accept the default app name (`theme`):

```bash
python manage.py tailwind init
```

Update `proj/settings.py` again and add the `theme` app, also set the
`TAILWIND_APP_NAME` and `INTERNAL_IPS` (not sure what those do 🤷):

```python
INSTALLED_APPS = [
  # other Django apps
  'tailwind',
  'theme',
  'django_browser_reload',
]
MIDDLEWARE = [
  # ...
  'django_browser_reload.middleware.BrowserReloadMiddleware',
  # ...
]
TAILWIND_APP_NAME = 'theme'
INTERNAL_IPS = ['127.0.0.1',]
```

Then back in the `proj/urls.py` file add this ditty:

```python
urlpatterns = [
    # ...,
    path('__reload__/', include('django_browser_reload.urls')),
]
```

After all that, now we install the Tailwind dependencies and start the watcher:

```bash
python manage.py tailwind install
python manage.py tailwind start
```

Update the `theme/templates/base.html` file to remove boiler plate:

```html
{% raw %}
{% load static tailwind_tags %}
<!DOCTYPE html>
<html lang="en">
	<head>
		<title></title>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<meta http-equiv="X-UA-Compatible" content="ie=edge">
		{% tailwind_css %}
	</head>
	<body class="leading-normal tracking-normal">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
			<!-- We've used 3xl here, but feel free to try other max-widths based on your needs -->
			<div class="max-w-3xl mx-auto">
			  {% if user.is_authenticated %}
				  Hi {{ user.username }}!
					<p><a href="{% url 'logout' %}">Log Out</a></p>
				{% else %}
					<p>You are not logged in</p>
					<a href="{% url 'login' %}">Log In</a>
				{% endif %}
				{% block content %}{% endblock %}
			</div>
		</div>
	</body>
</html>
{% endraw %}
```

You may need to run this to get the static assets built. This prints a backtrace for me, but seems to work:

```bash
python manage.py collectstatic --noinput
```


## Setup Authentication

We need to create the templates from scratch for login, and we need to build
both view and template for sign up.

We also need an app for creating the registration flow:

```bash
python manage.py startapp accounts
```

While we're in the terminal, we'll also create a superuser 🦸‍♂️

```bash
python manage.py createsuperuser
```

Create a new file `accounts/urls.py`:

```python
from django.urls import path

from .views import SignUpView

app_name = 'accounts'
urlpatterns = [
    path('signup/', SignUpView.as_view(), name='signup')
]
```

Then update the `accounts/views.py` file:

```python
from django.contrib.auth.forms import UserCreationForm
from django.shortcuts import render
from django.urls import reverse_lazy
from django.views import generic


class SignUpView(generic.CreateView):
    form_class = UserCreationForm
    success_url = reverse_lazy('login')
    template_name = 'registration/signup.html'
```

Update the `proj/urls.py` with:


```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # ...
    path('accounts/', include('accounts.urls')),
    path('accounts/', include('django.contrib.auth.urls')),
]
```

Update `proj/settings.py` with:

```python
INSTALLED_APPS = [
    # ...
    'accounts.apps.AccountsConfig',
]
# ...

LOGIN_REDIRECT_URL = '/' # new
LOGOUT_REDIRECT_URL = '/' # new
```

Create the login form:

```html
{% raw %}
{% extends 'base.html' %}

{% block content %}
<h2>Log In</h2>
<form method="post">
  {% csrf_token %}
  {{ form.as_p }}
  <button type="submit">Log In</button>
</form>
{% endblock %}
{% endraw %}
```

Now, if all went as planned, you should be able to login here: [localhost:8000/accounts/login/](http://localhost:8000/accounts/login/)

Then create the signup form:

```html
{% raw %}{% extends "base.html" %}

{% block content %}
  <h2>Sign up</h2>
  <form method="post">
    {% csrf_token %}
    {{ form.as_p }}
    <button type="submit">Sign Up</button>
  </form>
{% endblock %}
{% endraw %}
```

It's nice to have on the nav, so let's update the base and drop this in:

```html
{% raw %}
<a href="{% url 'accounts:signup' %}">Register</a>
{% endraw %}
```

## Take a break

Let's catch our breath, take a look at the lakes 🐟 and mountains 🏔 (love that emoji),

Before we get back on the trail, let's make sure we've run all the migrations and stuff:

```bash
python manage.py makemigrations
python manage.py migrate
```

Alright, the marathon continues!

## Payments

We're going to use [dj-stripe](https://dj-stripe.dev/) for handling webhooks
and building the database models for us.

### Setup dj-stripe

Install it:

```bash
pip install dj-stripe
```

Fire up the Stripe CLI's listener in another terminal so that it forwards
webhook events to the dj-stripe endpoint (We'll need that webhook signing
secret in the next step).

```bash
stripe listen --forward-to localhost:8000/stripe/webhook/
```


Update settings:

```python
INSTALLED_APPS = [
    # ...
    "djstripe",
    # ...
]
# ...

import os

STRIPE_TEST_SECRET_KEY = os.environ.get("STRIPE_TEST_SECRET_KEY", "<your secret key>")
STRIPE_LIVE_MODE = False  # Change to True in production
DJSTRIPE_WEBHOOK_SECRET = "whsec_xxx"  # Get it from the section in the Stripe dashboard where you added the webhook endpoint
DJSTRIPE_USE_NATIVE_JSONFIELD = True  # We recommend setting to True for new installations
DJSTRIPE_FOREIGN_KEY_TO_FIELD = "id"
```

Add to `proj/urls.py`:

```python
path("stripe/", include("djstripe.urls", namespace="djstripe")),
```

Run the dj-stripe migrations to create all the data:

```bash
python manage.py migrate
```

### Create the billing app

This app will render views for pricing pages, know how to handle payment flows,
and customer lifecycle management.

Create the app

```bash
python manage.py startapp billing
```

Then register it in the settings:

```python
INSTALLED_APPS = [
    # ...
    'billing.apps.BillingConfig',
]
```

### Pricing page

Add a view to the billing app that will render our pricing table, we'll also
wire up a simple checkout route that we'll build a bit later and will use
Stripe Checkout to redirect to the Checkout page.

Create a new View in `billing/views.py` like this:

```python
from django.shortcuts import render
from django.views.generic.base import TemplateView
from django.http import HttpResponseRedirect


class PricingView(TemplateView):
    template_name = 'prices.html'

    def get_context_data(self, *args, **kwargs):
        return {'prices': []}


def checkout(request, price_id):
    return HttpResponseRedirect("/pay")
```

We'll come back a little later and flesh out the logic for fetching prices,
let's just get the app set up.

Next we'll create a `billing/urls.py` file and wire up the Pricing view to the `/billing/prices/` route:

```python
from django.urls import path

from . import views

app_name = 'billing'
urlpatterns = [
    path("prices/", views.PricingView.as_view(), name="pricing"),
    path("checkout/<str:price_id>", views.checkout, name="checkout")
]
```

We also need to make sure our billing urls work at the root `proj/urls.py`:

```python
path('billing/', include('billing.urls')),
```

And, if we point at `prices.html` I guess we better create that too. We'll need
to create the templates dir for the billing app.

```bash
mkdir -p billing/templates/
touch billing/templates/{prices,thanks}.html
```

The goal with the next section is to build a nice pricing table
that will have links to `/billing/checkout/price_abc123/` where the price
is the price for a given plan level that users can subscribe.

This is a lot of tailwind stuff to build the pricing page, just stick with me. If you're looking
carefully, you'll see that we don't actually return any prices yet so all of that
inner loop is skipped anyways at this point:

```html
{% raw %}
{% extends "base.html" %}

{% block content %}
<div class="max-w-7xl mx-auto py-12 px-4 bg-white sm:px-6 lg:px-8">
  <h2 class="text-3xl font-extrabold text-gray-900 sm:text-5xl sm:leading-none sm:tracking-tight lg:text-6xl">Pricing</h2>

  <!-- Tiers -->
  <div class="mt-12 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
    {% for price in prices %}
    <div class="relative p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col">
      <div class="flex-1">
          <h3 class="text-xl font-semibold text-gray-900">{{ price.product.name }}</h3>

        <!-- recommended? -->
        {% if price.most_popular %}
          <p class="absolute top-0 py-1.5 px-4 bg-emerald-500 rounded-full text-xs font-semibold uppercase tracking-wide text-white transform -translate-y-1/2">Recommended</p>
        {% endif %}
        <!-- /recommended? -->

        <p class="mt-4 flex items-baselin text-gray-900">
          <span class="text-5xl font-extrabold tracking-tight">${{ price.amount|floatformat:-2 }}</span>
          <span class="ml-1 text-xl font-semibold">/{{ price.recurring.interval }}</span>
        </p>
        <p class="mt-6 text-gray-500">{{ price.product.description }}</p>

        <!-- Feature list -->
        <ul role="list" class="mt-6 space-y-6">
          {% for feature in price.features %}
            <li class="flex">
              <!-- Heroicon name: outline/check -->
              <svg class="flex-shrink-0 w-6 h-6 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span class="ml-3 text-gray-500">{{ feature }}</span>
            </li>
          {% endfor %}
        </ul>
      </div>

      <!-- recommended? -->
      {% if price.most_popular %}
        <a href="{% url 'polls:checkout' price.id %}" class="bg-emerald-500 text-white hover:bg-emerald-400 mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium">Monthly billing</a>
      {% else %}
        <a href="{% url 'polls:checkout' price.id %}" class="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 mt-8 block w-full py-3 px-6 border border-transparent rounded-md text-center font-medium">Monthly billing</a>
      {% endif %}
    </div>
    {% endfor %}
  </div>
</div>
{% endblock %}
{% endraw %}
```

Okay, now this should show at least our header:
[localhost:8000/billing/prices/](http://localhost:8000/billing/prices/)

Time to fetch prices to hydrate this beast. We want to use the Stripe API
directly now, we're going to fetch the list of monthly prices filtered by their
lookup_keys. Later we'll pass in the interval.

```python
prices = stripe.Price.list(
    expand=['data.product'],
    recurring={
        'interval': 'month',
    },
    lookup_keys=[
        'startup',
        'startup_annual',
        'business',
        'business_annual',
        'enterprise',
        'enterprise_annual',
    ]
)
```

Next we want to pull some attributes out of the product level metadata
and attach that directly to the price objects:

```python
for p in prices['data']:
    p.features = json.loads(p.product.metadata.features)
    p.most_popular = 'most_popular' in p.product.metadata
    p.amount = p.unit_amount / 100
```

To get that to work, we need to both import `json` and set our Stripe API key.

Here's what it looks like all together:

```python
# billing/views.py
from django.shortcuts import render
from django.views.generic.base import TemplateView
from django.http import HttpResponseRedirect

# new from here down
import json
import stripe
from djstripe.settings import djstripe_settings

stripe.api_key = djstripe_settings.STRIPE_SECRET_KEY

class PricingView(TemplateView):
    template_name = 'pricing.html'

    def get_context_data(self, *args, **kwargs):
        prices = stripe.Price.list(
            expand=['data.product'],
            recurring={
                'interval': 'month',
            },
            lookup_keys=[
                'startup',
                'startup_annual',
                'business',
                'business_annual',
                'enterprise',
                'enterprise_annual',
            ]
        )
        for p in prices['data']:
            p.features = json.loads(
                p.product.metadata.features
            )
            p.most_popular = 'most_popular' in p.product.metadata
            p.amount = p.unit_amount / 100
        sorted_prices = sorted(prices['data'], key=lambda p: p['unit_amount'])
        return { 'prices': sorted_prices }

#checkout route is still down here somewhere.
```

Next step, let's actually redirect to Stripe Checkout!

### Redirecting to Stripe Checkout

This is straight forward, even though there are a lot of arguments to the API call, it's 1 API call
to get a thing that has a URL that we then redirect to and it looks like this:

```python
from django.urls import reverse
from djstripe.models import Customer

# ...

@login_required
def checkout(request, price_id):
    # Gotta go create this success url later.
    success_url = request.build_absolute_uri(reverse("billing:thanks"))
    cancel_url = request.build_absolute_uri(reverse("billing:prices"))

    metadata = {
        f"{djstripe_settings.SUBSCRIBER_CUSTOMER_KEY}": request.user.id
    }

    # Ensure this subscriber has a Stripe customer, if not create one
    # This will fire an API call to Stripe to create a new customer.
    customer, created = Customer.get_or_create(subscriber=request.user)

    session = stripe.checkout.Session.create(
        customer=customer.id,
        subscription_data={
            "metadata": metadata,
        },
        line_items=[{
            "price": price_id,
            "quantity": 1,
        }],
        mode="subscription",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )

    return HttpResponseRedirect(session.url)

def thanks(request):
    return render(request, "thanks.html", {})
```

Note that the user must be logged in, thats so we can upsert the related Stripe
Customer and associate the new subscription with that customer.

We'll need this import so we can use that `@login_required` decorator:

```python
from django.contrib.auth.decorators import login_required
```


### Setting up the customer portal and billing management

The customer portal is a Stripe hosted page for billing management. Customers
can do things like update their card on file, change between plan levels,
cancel, etc.

The integration is similar, and even simpler than checkout. We again make
an API call to create a billing portal session, then redirect to it's URL.


First we create the view:

```python
@login_required
def billing(request):
    customer = get_object_or_404(Customer, subscriber=request.user)
    return_url = request.build_absolute_uri(
        reverse("billing:thanks")
    )
    session = stripe.billing_portal.Session.create(
        customer=customer.id,
        return_url=return_url,
    )
    return HttpResponseRedirect(session.url)
```

### Provisioning access

The `@login_required` ensures we have a logged in user who is who they say that
they are. Now we need to ensure the user has an active subscription.

Here's one approach that builds a simple decorator for basic view functions:

Put this in `proj/decorators.py`

```python
from functools import wraps
from djstripe.models import Customer
from django.core.exceptions import ImproperlyConfigured
from django.http import HttpResponse, Http404, HttpResponseRedirect
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser


def is_active(subscriber):
    if isinstance(subscriber, AnonymousUser):
        raise ImproperlyConfigured(ANONYMOUS_USER_ERROR_MSG)

    if isinstance(subscriber, get_user_model()):
        if subscriber.is_superuser or subscriber.is_staff:
            return True
    try:
        customer = Customer.objects.get(subscriber=subscriber)
    except Customer.DoesNotExist:
        return False

    return customer.has_any_active_subscription()


def subscription_required(view_func=None):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if is_active(request.user):
            print('user is subscribed')
            return view_func(request, *args, **kwargs)
        return HttpResponseRedirect("/polls/")

    return wrapper
```

Now for basic views, you can do something like this:

```python
@subscription_required
def secret_view(request):
    return ResponseForPayingSubscribers()
```

I haven't built a mixin to make this work with class based
views, but the logic would be very similar.
