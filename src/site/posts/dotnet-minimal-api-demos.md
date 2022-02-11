---
title: .NET Minimal API patterns for Code Samples
date: 2022-02-11
---

At Stripe, we create [Stripe Samples](https://github.com/stripe-samples), which
are end-to-end modular code samples that include one or many integrations, one
or many clients, and several server implementations.

If you have the [Stripe CLI](https://stripe.com/docs/stripe-cli) installed, you
can call `stripe samples create issuing` to see how to quickly install these.

We try to implement each server so that it exposes the same APIs so that we can
implement several clients that can be swapped in and out.

For instance, we might have a sample with directories like:

```sh
payment-element
├──client
│  └──html
│  └──react
│  server
│  └──ruby
│  └──dotnet
checkout
├──client
│  └──html
│  └──react
│  server
│  └──ruby
│  └──dotnet
```

We'll want the server endpoints for both the ruby and dotnet applications to
accept the same requests and return the same well formed responses. Ideally,
without compromising the readability or conventionality of the code.

I found that using the new .NET minimal APIs is much better than the older MVC
style .NET apps for building these samples for the primary reason that _most_
of the code is co-located in `Program.cs`.

Another trick to re-using the same clients is that we want to either serve those
static html files, or run the react/vue/svelte apps on separate ports and proxy
the relevant API calls to the servers.

Here are some tips for getting your .NET minimal API code samples.

## Serving static files with .NET 6

Given we're going to serve static files, we want to use the
`PhysicalFileProvider` which we can import from
`Microsoft.Extensions.FileProviders`.

Next, once we've built our App, we can call `UseStaticFiles` and pass in
the StaticFileOptions with the path to our static files.

```cs
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseStaticFiles(new StaticFileOptions()
{
    FileProvider = new PhysicalFileProvider(
        Path.Combine(Directory.GetCurrentDirectory(), @"../../client")
    ),
    RequestPath = new PathString("")
});
```

Note that if you are serving a root file that you want to render, like
`index.html` for example, that won't act as the default response when handling
requests for the root route (`/`).

I worked around this by mapping `/` to a redirect to the `index.html` page.

```cs
app.MapGet("/", () => Results.Redirect("/index.html"));
```

## Parsing incoming JSON

For years, I've used Newtonsoft.Json, but I was having some issues configuring
it so that it worked with SnakeCased json. There's this super long solution on
[StackOverflow](https://stackoverflow.com/questions/69850917/how-to-configure-newtonsoftjson-with-minimalapi-in-net-6-0),
but that seemed like overkill for a simple example.

Instead, my teammate [Cecil](https://twitter.com/cecilphillip) showed me how to
use `System.Text.Json` to parse the HTTP request from the client directly.

First, we need a class that we're going to bind to when deserializing. Check out this one
that I used to manually configure the property names. Note this is super similar
to Newtonsoft.Json's `JsonProperty` decorator/attribute thing, but is called `JsonPropertyName` and
is imported from `System.Text.Json.Serializer`.

```cs
using System.Text.Json;
using System.Text.Json.Serialization;

public class CreateCardholderRequest
{
    [JsonPropertyName("name")]
    public string Name { get; set; }

    [JsonPropertyName("email")]
    public string Email { get; set; }

    [JsonPropertyName("phone_number")]
    public string PhoneNumber { get; set; }
}
```

That class expects to bind to some JSON that looks like:

```json
{
  "name": "CJ Avilla",
  "email": "wave@cjav.dev",
  "phone_number": "8008675309"
}
```

Here's the first few lines of the endpoint for creating Issuing Cardholders. Notice
that instead of doing model binding at the callback parameter level, we're
taking in an `HttpContext` and manually deserializing into an instance of `CardHolderRequest`.


```cs
app.MapPost("/create-cardholder", async (HttpContext ctx) =>
{
  using var requestBodyStream = new StreamReader(ctx.Request.Body);
  var payload = await requestBodyStream.ReadToEndAsync();
  var req = JsonSerializer.Deserialize<CreateCardholderRequest>(payload);
```

Seeing that `using` statement was new to me. Cecil taught me that it's syntactic sugar over the older
block style using statement like:

```cs
using(x) {
}
```

Here's the docs for [`using`](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/using-statement).

## Don't try to serialize exceptions directly

I was running into this error:

```sh
fail: Microsoft.AspNetCore.Diagnostics.DeveloperExceptionPageMiddleware[1]
      An unhandled exception has occurred while executing the request.
      System.NotSupportedException: Serialization and deserialization of 'System.IntPtr' instances are not supported. Path: $.TargetSite.MethodHandle.Value.
       ---> System.NotSupportedException: Serialization and deserialization of 'System.IntPtr' instances are not supported.
         at System.Text.Json.Serialization.Converters.UnsupportedTypeConverter`1.Write(Utf8JsonWriter writer, T value, JsonSerializerOptions options)
         at System.Text.Json.Serialization.JsonConverter`1.TryWrite(Utf8JsonWriter writer, T& value, JsonSerializerOptions options, WriteStack& state)
         at System.Text.Json.Serialization.Metadata.JsonPropertyInfo`1.GetMemberAndWriteJson(Object obj, WriteStack& state, Utf8JsonWriter writer)
         at System.Text.Json.Serialization.Converters.ObjectDefaultConverter`1.OnTryWrite(Utf8JsonWriter writer, T value, JsonSerializerOptions options, WriteStack& state)
         at System.Text.Json.Serialization.JsonConverter`1.TryWrite(Utf8JsonWriter writer, T& value, JsonSerializerOptions options, WriteStack& state)
         at System.Text.Json.Serialization.Metadata.JsonPropertyInfo`1.GetMemberAndWriteJson(Object obj, WriteStack& state, Utf8JsonWriter writer)
         at System.Text.Json.Serialization.Converters.ObjectDefaultConverter`1.OnTryWrite(Utf8JsonWriter writer, T value, JsonSerializerOptions options, WriteStack& state)
         at System.Text.Json.Serialization.JsonConverter`1.TryWrite(Utf8JsonWriter writer, T& value, JsonSerializerOptions options, WriteStack& state)
         at System.Text.Json.Serialization.Metadata.JsonPropertyInfo`1.GetMemberAndWriteJson(Object obj, WriteStack& state, Utf8JsonWriter writer)
         at System.Text.Json.Serialization.Converters.ObjectDefaultConverter`1.OnTryWrite(Utf8JsonWriter writer, T value, JsonSerializerOptions options, WriteStack& state)
         at System.Text.Json.Serialization.JsonConverter`1.TryWrite(Utf8JsonWriter writer, T& value, JsonSerializerOptions options, WriteStack& state)
         at System.Text.Json.Serialization.JsonConverter`1.WriteCore(Utf8JsonWriter writer, T& value, JsonSerializerOptions options, WriteStack& state)
         --- End of inner exception stack trace ---
         at System.Text.Json.ThrowHelper.ThrowNotSupportedException(WriteStack& state, NotSupportedException ex)
         at System.Text.Json.Serialization.JsonConverter`1.WriteCore(Utf8JsonWriter writer, T& value, JsonSerializerOptions options, WriteStack& state)
         at System.Text.Json.Serialization.JsonConverter`1.WriteCoreAsObject(Utf8JsonWriter writer, Object value, JsonSerializerOptions options, WriteStack& state)
         at System.Text.Json.JsonSerializer.WriteCore[TValue](JsonConverter jsonConverter, Utf8JsonWriter writer, TValue& value, JsonSerializerOptions options, WriteStack& state)
         at System.Text.Json.JsonSerializer.WriteStreamAsync[TValue](Stream utf8Json, TValue value, JsonTypeInfo jsonTypeInfo, CancellationToken cancellationToken)
         at System.Text.Json.JsonSerializer.WriteStreamAsync[TValue](Stream utf8Json, TValue value, JsonTypeInfo jsonTypeInfo, CancellationToken cancellationToken)
         at System.Text.Json.JsonSerializer.WriteStreamAsync[TValue](Stream utf8Json, TValue value, JsonTypeInfo jsonTypeInfo, CancellationToken cancellationToken)
         at Microsoft.AspNetCore.Http.HttpResponseJsonExtensions.WriteAsJsonAsyncSlow(Stream body, Object value, Type type, JsonSerializerOptions options, CancellationToken cancellationToken)
         at Microsoft.AspNetCore.Http.RequestDelegateFactory.ExecuteTaskResult[T](Task`1 task, HttpContext httpContext)
         at Microsoft.AspNetCore.Routing.EndpointMiddleware.<Invoke>g__AwaitRequestTask|6_0(Endpoint endpoint, Task requestTask, ILogger logger)
         at Microsoft.AspNetCore.Diagnostics.DeveloperExceptionPageMiddleware.Invoke(HttpContext context)
```

And it was because, I was trying to directly serialize the Exception in the response using:

```cs
// BAD!
catch(StripeException e)
{
  Console.WriteLine($"API Call to Stripe failed. {e.StripeError.Message}");
  return Results.BadRequest(e);
}
```

Instead, BadRequest needs to be passed something that can be serialized
(apparently a `StripeException` isn't that!). Here's what worked:

```cs
// GOOD!
catch(StripeException e)
{
  Console.WriteLine($"API Call to Stripe failed. {e.StripeError.Message}");
  return Results.BadRequest(new { error = new { message = e.StripeError.Message }});
}
```

