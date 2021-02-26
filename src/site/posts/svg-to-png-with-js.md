---
title: SVG to PNG with JavaScript
date: 2021-02-20
---

<iframe width="560" height="315" src="https://www.youtube.com/embed/-oXRpzLyz6Q" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

I wanted to take an SVG file generated with some data from Rails and convert
that into a png that could be exported and used as a thumnail on YouTube. One
of the odd requirements for the SVG is that I want to use [Google
Fonts](https://fonts.google.com/) and many of the SVG to PNG options weren't
translating the font from a css `@import` statement..

I tried a few things that didn't work well and wanted to document incase others
encounter the same.

First, I thought I could just use imagemagic with the
[rmagick](https://github.com/rmagick/rmagick) gem and that would work however I
ran into several issues loading fonts.

Eventually, using JavaScript on the client with an HTML canvas element worked.
I found and modified this code snippet on
[bl.ocks.org](http://bl.ocks.org/biovisualize/8187844).

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

My workflow starts with designing the thumbnail in Figma, then exporting as SVG
replacing the SVG fonts that were exported by Figma and converting those into
`<text>` blocks with specific CSS classes to set the font family. Then,
rendering content into the text block with ERB.


```html
<svg width="1920" height="1080" viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
<style>
  /* this bit doesn't work while converting to png: */
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;900');
  .subhead {
    fill: #C2F7EB;
    font-family: Roboto;
    font-weight: 300;
    font-size: 60px;
    text-transform: uppercase;
  }
  .title {
    fill: #F72585;
    font-family: Roboto;
    font-weight: 900;
    font-size: 144px;
  }
  </style>
  <g clip-path="url(#clip0)">
    <rect width="1920" height="1080" fill="white"/>
    <rect width="1920" height="1080" fill="#1B1725"/>
    <text x="77" y="250" class="subhead">Ruby Metaprogramming</text>
    <text x="77" y="420" class="title">Object#send</text>
  </g>
  <defs>
    <clipPath id="clip0">
      <rect width="1920" height="1080" fill="white"/>
    </clipPath>
  </defs>
</svg>

```

An SVG will load fine with the correct fonts when loaded in the browser using
an @import statement pointing at a font CDN like the one for Google fonts, however
when converting the SVG into a PNG those remote font faces are lost.

The next trick to get this bit working was to base64 encode the font file and
use a data url to embed the full content of the font into the CSS for styling
the text blocks.

If you download a font family from Google fonts, you'll get a set of `.tff` files.

Using the built in `base64` tool on Mac, you can convert the file into base64 and
paste that into the font family like so:


```html
<svg width="1920" height="1080" viewBox="0 0 1920 1080" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <style>
  @font-face {
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 300;
    font-display: swap;
    src: url(data:font/truetype;charset=utf-8;base64,AAEAAAASAQAABAAgR0RFRnBqbY4AAaOkAAAB6kdQT1PZc2ujAAGlkAAATrpHU1VC0HjTzgAB9EwAAAoCT1MvMpcesZEA...)
  }
  @font-face {
    font-family: 'Roboto';
    font-style: normal;
    font-weight: 900;
    font-display: swap;
    src: url(data:font/truetype;charset=utf-8;base64,AAEAAAASAQAABAAgR0RFRnBqbY4AAaAMAAAB6kdQT1MfGyUBAAGh+AAAVhxHU1VC0HjTzgAB+BQAAAoCT1MvMpl2sdgA...)
  }
  .subhead {
    fill: #C2F7EB;
    font-family: Roboto;
    font-weight: 300;
    font-size: 60px;
    text-transform: uppercase;
  }
  .title {
    fill: #F72585;
    font-family: Roboto;
    font-weight: 900;
    font-size: 144px;
  }
  </style>
  <g clip-path="url(#clip0)">
    <rect width="1920" height="1080" fill="white"/>
    <rect width="1920" height="1080" fill="#1B1725"/>
    <text x="77" y="250" class="subhead">Ruby Metaprogramming</text>
    <text x="77" y="420" class="title">Object#send</text>
  </g>
  <defs>
    <clipPath id="clip0">
      <rect width="1920" height="1080" fill="white"/>
    </clipPath>
  </defs>
</svg>
```
