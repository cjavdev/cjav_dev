---
title: SVG to PNG with JavaScript
date: 2021-02-20
---

I wanted to take an SVG file generated with some data from Rails and convert that into
a png that could be exported and used as a thumnail on YouTube. One of the
odd requirements for the SVG is that I want to use [Google Fonts](https://fonts.google.com/)
and many of the SVG to PNG options weren't translating the font from a css `@import` statement..

I tried a few things that didn't work well and wanted to document incase others
encounter the same.

First, I thought I could just use imagemagic with the
[rmagick](https://github.com/rmagick/rmagick) gem and that would work however I
ran into several issues loading fonts.

Eventually, using JavaScript on the client with an HTML canvas element worked. I found
and modified this code snippet on [bl.ocks.org](http://bl.ocks.org/biovisualize/8187844).

```html
<div id="svg-container">
  <%= File.read(File.join(Rails.root, "public", "thumb-template.svg")).html_safe %>
</div>

<canvas id="canvas" width="1920" height="1080"></canvas>
<div id="png-container"></div>

<script>
var svgString = new XMLSerializer().serializeToString(document.querySelector('svg'));
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var DOMURL = self.URL || self.webkitURL || self;
var img = new Image();
var svg = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"});
var url = DOMURL.createObjectURL(svg);
img.onload = function() {
    ctx.drawImage(img, 0, 0);
    var png = canvas.toDataURL("image/png");
    document.querySelector('#png-container').innerHTML = '<img src="'+png+'"/>';
    DOMURL.revokeObjectURL(png);
};
img.src = url;
</script>
```
