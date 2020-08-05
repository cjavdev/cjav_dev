---
title: Hi friends!
subtitle: I'm CJ Avilla, and I help developers integrate @StripeDev 💳!
layout: layouts/base.njk
---

I love learning languages and tech stacks 🥞 and sharing that 🎥.

My partner in crime and I podcast about general life stuff  🎙 @ http://avillatheory.com

## Current Projects

## Posts

The pages found in in the posts

<ul class="listing">
{%- for page in collections.post -%}
  <li>
    <a href="{{ page.url }}">{{ page.data.title }}</a> -
    <time datetime="{{ page.date }}">{{ page.date | dateDisplay("LLLL d, y") }}</time>
  </li>
{%- endfor -%}
</ul>


```js
const thing = await stripe.createAdvocate();
```
