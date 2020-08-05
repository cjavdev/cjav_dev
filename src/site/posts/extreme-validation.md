---
title: Extreme Validation
date: 2015-11-27
---

I’ve observed an interesting trend in some new companies over the past few years. Companies like IFTTT (consolidates small pieces of functionality exposed via tons of different apis), Buffer (aggregates the creation functions available on social media apis), Coverhound (aggregates searchable insurance platforms), Zapier etc. All integrate tons of third party APIs to provide a consolidated platform. I happen to currently work on one of these integration projects. This type of integration development comes with it an interesting little problem: validation.

We integrate with many APIs that provide similar but not exactly the same data and we need to validate user input against not only our business rules, but also optionally many 3rd party rules. One of the biggest downsides to some integrations is that often third parties will only sync data once daily rather than immediately when data changes. The problem is that if the user changes some data that violates the business rules of the company that syncs once per day, by default the user will have a long delay between changing the data and when the validation fails.

One of the most common things a developer does is validate user input. Whether it’s an email, photo or file, you’ve likely got some special validations about size, dimensions or format. Let’s say that your business requires that the User address or lat/lng is present and is in a valid format. If you’re using Rails there are simple built in ActiveRecord validations or you could write a custom one off method to validate this rule.

When integrating and syncing to multiple different APIs that all have requirements specific to their business the problem gets much more interesting. Lets spice up our example and consider that we want to sync our users data to partner a: GCorp and/or partner b: LBoss.

GCorp requires the address is present and follows RFC 5774.

LBoss requires that the lat/lng is present and falls within the standard decimal (-90 to 90, and -180 to 180).

We anticipate and would love to integrate with more parties in the future, and not all users will setup syndication with both partners. So in some cases we want to be strict about requiring certain information from customers, and in other cases we’re more flexible with what we will accept.

After several iterations this is roughly the model that I came up with to solve this problem:

First: The base validation system is built out of `Validator` objects that consist of a set of `Validation`s. Each `Validation` is a callable that either returns nothing, or a `ValidationError` or an array of `ValidationError`s.

Second: Each user account has a collection of `Notification`s. The purposes for our exercise will be to display to the user a list of all the issues with their data.

Third: Signals. For each third party integration will register a set of signal handlers that fire when the important models change. In our case when the User model is saved and the address changes that will fire a signal handler that we have registered to run the User specific validators for GCorp. We will have a separate signal handler for LBoss validators.

If any of the validators fail in the signal handlers, a Notification is created so that we can flash the user with third party specific validation information.

The flow is something like this:

Users updates data for model X -> POST to our server -> Update model X -> Signal handlers for each partner run for model X -> if any validations fail `Notification`s are created -> Response includes usual 200 ok. Subsequent requests for the User account will include the associated notifications for all failed validations (we have a separate mechanism for busting this cache).

**Validation** encapsulates logic for the business rule

**Validator** encapsulates logic for running and collecting results of Validations

**ValidationError** encapsulates data about failed validation

**Notification** created when validation fails

**Signal/Callback** convenient mechanism to run validations in a decoupled way allowing different rules to run depending on which third parties the user has integrated with

The biggest takeaways are: If you’re trying to validate business rules for your business in addition to integrated third parties, one approach might be to split those third party validations out into their own module, and run them in some post save / post delete  phase via either a signal, trigger, or callback. (signals are great for this in django, in rails I would consider using some of the active record callbacks).
