---
layout: layouts/base.njk
pageClass: posts
templateEngineOverride: njk, md
---

<p class="date">
  Posted on <time datetime="{{ date }}">{{ date | dateDisplay }}</time>
</p>
<main>
  {{ content | safe }}
  <div class="footnote">
    <p>
    </p>
  </div>
</main>
