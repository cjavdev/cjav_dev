---
title: Hi friends!
subtitle: I'm CJ Avilla, and I help developers integrate @StripeDev 💳!
layout: layouts/base.njk
---

I love learning languages and tech stacks 🥞 and sharing that 🎥.

My partner in crime and I podcast about general life stuff  🎙 @ [avillatheory.com](https://avillatheory.com)

## Let's connect!

DMs are open and I'm happy to chat [@cjav_dev](https://twitter.com/cjav_dev)!

Also down to [Link In 😉](https://www.linkedin.com/in/cjavilla/), 💼 style.

Did I mention, I screencast 🖥🎥?  [personal](https://www.youtube.com/channel/UCYUC-bdnQRJDhZRL2c_NKVw?view_as=subscriber) || [work](https://www.youtube.com/channel/UCd1HAa7hlN5SCQjgCcGnsxw?view_as=subscriber)

Want to lurk my GitHub? [@cjavilla-stripe (work)](https://github.com/cjavilla-stripe) || [@cjavdev (personal)](https://github.com/cjavdev).

Feel free to correct my answers 😂 on [StackOverflow](https://stackoverflow.com/users/2530680/cjav-dev).



## Writing

(Stale and stalled, I know!)

<ul class="listing">
{%- for page in collections.post | reverse -%}
  <li>
    <a href="{{ page.url }}">{{ page.data.title }}</a> -
    <time datetime="{{ page.date }}">{{ page.date | dateDisplay("LLLL d, y") }}</time>
  </li>
{%- endfor -%}
</ul>

## Shameless Affiliate Links

Here's some links to things that I really enjoy, and hope you do to! Buy things so I can get affiliate 🤑

 - [Transistor.fm](https://transistor.fm/?via=cj)
 - [Peloton](https://www.onepeloton.com/referrals/PV6BBX/social-share) ($100 off accessories!)
<!--  - [TaxJar](https://taxjar.grsm.io/cjavilla8858) -->
<!--  - [TradeGecko](https://go.tradegecko.com/register?code=cjavilla) -->
