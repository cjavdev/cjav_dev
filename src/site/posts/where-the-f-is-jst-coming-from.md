---
title: Where the F is JST coming from?!?
date: 2015-04-10
---

If you’ve built a Rails + Backbone app you know that a common way to use templates is by writing files with the `.jst.ejs` file extension. Additionally, you may take for granted the fact that these templates are precompiled `_.template` style for you. As you know they are made available in the JST namespace via properties with the same name as the file (including directory).

Recently I received these questions: "Where does JST come from? Which javascript file is adding that namespace?"



I had to stop and think on it for a bit. Where do these come from. Are they added to application.js? No. Are they injected into the HTML as template script tags? No! The secret is in the asset pipeline. The sprockets gem has a JST Processor which slurps up the .jst files and transpiles them into .js files! In development you’re assets directory gets fatter by the number of directories in your app/assets/templates. In production these all get concatenated into application-fingerprint.js. Each generated JS file contains an IIFE which memoizes the definition of the JST namespace, then appends to it the result of running the ejs compilation step which returns the compiled template function.

[First checkout the JST Processor](https://github.com/rails/sprockets/blob/92eb3072790cef9f1e28c9670abeddcf45de8099/lib/sprockets/jst_processor.rb)

Then read every line (100) of the [ejs gem](https://github.com/sstephenson/ruby-ejs/blob/master/lib/ejs.rb)

[This gist](https://gist.github.com/jgorset/1747655) is pretty good at explaining the resulting IIFE.

Going even deeper down the rabbit hole!

How does the asset pipeline even know what to do with the .ejs file? Where is that section of the pipeline added?

It turns out that the sprockets gem is yet another step ahead of us. Checkout the [EJS template](https://github.com/sstephenson/sprockets/blob/1566cd10486b677d52d93c74f489ad7a8d2acd79/lib/sprockets/ejs_template.rb) and the [EJS Processor](https://github.com/rails/sprockets/blob/57e918df66b2f26416dbe2455a23769615146b04/lib/sprockets/ejs_processor.rb). Sprockets will look for the EJS ruby constant to be defined, and if it is will call EJS.compile when evaluated.

So now you know! When Sprockets loads and starts processing a file with the extension jst.ejs it will call the EJS processor, which will call the EJS template which will call into the EJS gem to get back the compiled result of the ejs template. Then the result is processed by the JST Processor which wraps the compiled template in an IIFE and sets up the JST namespace.
