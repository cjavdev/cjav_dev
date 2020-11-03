---
title: Hi friends!
subtitle:
layout: layouts/base.njk
---

I'm CJ Avilla, and I help developers integrate [Stripe](http://stripe.com) 💳!

<div class="itme"></div>

I'm interested in learning new programming languages; building high leverage
tools; and recently, sharing what I've learned from dozens of other incredible
and generous friends and online strangers in the form of video content.

When AFK, I work on projects around the house and play games with my wife and
our two sons.

My partner in crime and I podcast about family, health, parenting, real estate, and money 🎙 @ [avillatheory.com](https://www.avillatheory.com)

## Let's connect!

|   |   |
|---|---|
| Twitter | [@cjav_dev](https://twitter.com/cjav_dev) |
| LinkedIn | [cjavilla](https://www.linkedin.com/in/cjavilla/)  |
| YouTube (personal) | [CJ Avilla](https://www.youtube.com/channel/UCYUC-bdnQRJDhZRL2c_NKVw?view_as=subscriber) |
| YouTube (work) | [Stripe Developers](https://www.youtube.com/channel/UCd1HAa7hlN5SCQjgCcGnsxw?view_as=subscriber) |
| GitHub (personal) | [@cjavdev](https://github.com/cjavdev) |
| GitHub (work) | [@cjavilla-stripe](https://github.com/cjavilla-stripe)  |
| StackOverflow | [cjav_dev](https://stackoverflow.com/users/2530680/cjav-dev) |

## Recent Videos

<ul class="listing">
  <li>
    <a href="https://www.youtube.com/watch?v=LhMPRWOtdZ4" target="_blank">CJ Avilla - Intro to values and types in JavaScript</a>
    <time datetime="August 30, 2020">August 30, 2020</time>
  </li>
  <li>
    <a href="https://www.youtube.com/watch?v=u8H6awDJVpM" target="_blank">Stripe Developers - Integrating the customer portal</a>
    <time datetime="June 29, 2020">June 29, 2020</time>
  </li>
</ul>

## Podcast Episodes

<ul class="listing">
{%- for ep in transistor.data -%}
  <li>
    <a href="{{ ep.attributes.share_url }}" target="_blank">{{ ep.attributes.title }}</a>
    <time datetime="{{ ep.attributes.published_at }}">{{ ep.attributes.formatted_published_at }}</time>
  </li>
{%- endfor -%}
</ul>


## Writing

(Stale and stalled, I know!)

<ul class="listing">
{%- for page in collections.post | reverse -%}
  <li>
    <a href="{{ page.url }}">{{ page.data.title }}</a>
    <time datetime="{{ page.date }}">{{ page.date | dateDisplay("LLLL d, y") }}</time>
  </li>
{%- endfor -%}
</ul>

## Currently reading ({{ goodreads_reading.books.total }})

<ul class="reading">
{%- for book in goodreads_reading.books.book -%}
  <li>
    <a href="{{ book.link }}">{{ book.title_without_series }}</a>
    <small></small>
  </li>
{%- endfor -%}
</ul>


## Recently read

<ul class="reading">
{%- for book in goodreads_read.books.book -%}
  <li>
    <a href="{{ book.link }}">{{ book.title_without_series }}</a>
    <small></small>
  </li>
{%- endfor -%}
</ul>

<!-- ## Shameless Affiliate Links -->
<!--  -->
<!-- Here's some links to things that I really enjoy, and hope you do to! Buy things so I can get affiliate 🤑 -->
<!--  -->
<!--  - [Transistor.fm](https://transistor.fm/?via=cj) -->
<!--  - [Peloton](https://www.onepeloton.com/referrals/PV6BBX/social-share) ($100 off accessories!) -->
<!--  - [TaxJar](https://taxjar.grsm.io/cjavilla8858) -->
<!--  - [TradeGecko](https://go.tradegecko.com/register?code=cjavilla) -->
