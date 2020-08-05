---
title: Open tab from JavaScript
date: 2015-02-26
---

I’ve been super interested in productivity hacking lately. Part of my “look something up” workflow looks like this:

1. search google for something
1. open the first N promising looking links in new tabs
1. click on the tab who’s favicon finishes spinning first
1. scan, and if dead end CMD+W


I’ve found that the quicker I can see that a page is a dead end the better. It isn’t all that much work to click on each link individually, but because I do it A LOT when learning something new, I’ve always wanted a shortcut.

[@vveleva](https://twitter.com/vveleva) and I built this awesome chrome extension (Auto Open Links): [https://chrome.google.com/webstore/detail/auto-open-links/coiapeoijgdcanenjddgdgcepejabljl](https://chrome.google.com/webstore/detail/auto-open-links/coiapeoijgdcanenjddgdgcepejabljl)

When added to chrome, it allows you to press **CTRL+SHIFT+3** to open the first three google search results in new tabs.

This morning while we were exploring options for opening a new tab from javascript we stumbled upon [this stackoverflow question](http://stackoverflow.com/questions/4907843/open-a-url-in-a-new-tab-using-javascript). Some answers suggest there is no way to open a tab, other give interesting hacks, eventually we decided to build our own with these considerations:

1. It would be nice to just use [vanilla js](http://vanilla-js.com/).
1. Only needs to work on google search results page.
1. Must open in new tab, not new window.

**NB:** It’s completely possible to open a new tab with the following, but for some reason this doesn’t work on the google search results page from a chrome extension:

```js
window.open("https://status203.me/", "_blank");
```

From some initial digging we found some documentation somewhere that mentions [a way to create new chrome tabs](https://developer.chrome.com/extensions/tabs#method-create):

```js
chrome.tabs.create({ url: "https://status203.me/" }); // nope!
```

After testing this out, we found that it would only reliably work from the "New Tab."

At this point I started to think about how I actually open each link. Is there a way that we could simulate the actions I’m actually taking, but with javascript. Well, as I’m opening each link, I hold down the CMD key and click each link. (In chrome that’s how you open a link in a new tab).

Is there a way to construct a custom mouse event and dispatch that event to the links on the page? There is! Via the [MouseEvent](https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent) API!

By simply constructing an instance of MouseEvent with the options we’re interested in we could find the links and dispatch our custom mouse event to those links. Check out the code:


```js
var event = new MouseEvent('click', {
  'metaKey': true
});
var link = document.querySelector('a#myLink');
link.dispatchEvent(event);
```

If for some reason, `window.open` isn’t working for you, consider constructing a custom MouseEvent! 🙂

Here’s the repo: [https://github.com/vveleva/auto_open_links](https://github.com/vveleva/auto_open_links) if you want to check out the extension!
