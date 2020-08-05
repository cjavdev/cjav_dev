---
title: App landing page for ionic app
date: 2015-01-28
---

We’ve all been to sites that explain features of an app and entice you to visit the market place and download. If you’ve developed an app and are starting to build out a landing page, you might have googled “app landing page” and found some themes from [themeforest.net](http://themeforest.net/category/marketing/landing-pages/technology/apps?ref=cjavilla). These are flashy designs that display the features of the app and expect the creator to drop in app screenshots that my slide around or transition as you move between features.

Something great about apps built with ionic framework is that you can demo the nearly full (minus device features) app right on your marketing page (not sure this is cool, legally). I’ve done that for a couple ionic apps: [Pushbit](http://www.pushbit.io/marketing) and [Insider AI](https://insiderai.com/mobile) and want to show you how.

These two pages are both being served from Rails apps, but you shouldn’t have any difficulty getting things working from your own server.

The key here is to **_run the ionic app in an iframe._**

In Rails, there is a /public directory that contains static html. In /public I’ll create a directory called app and copy the contents of www to app.

In the html for the page, I’ll put the image of the device as the background, then an iframe pointing to the app’s index.html. The iframe should be in an iframe tag, but to comply with the blog formatting I’ve omitted the tag brackets.

```html
<div id="phone">
  <img src="/assets/iphone6.png">
  <iframe src="/app/index.html" frameBorder="0" class="screens"></iframe>
</div>
```
