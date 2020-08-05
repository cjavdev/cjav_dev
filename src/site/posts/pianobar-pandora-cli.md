---
title: Pianobar +1 Pandora CLI
date: 2016-02-01
---


If you’re like me, you jam to pandora while writing code. Currently my favorite station is “Indie Electronic Radio.” Are you also a home row hero? @Nathan, I’m lookin at you. 🙂

As a web developer I make heavy use of the browser, often multiple browsers. My current go-to is Chrome, but I’ll often run admin tools in Safari and / or run tests in Firefox.

One problem with my workflow is that I constantly create and destroy tabs and sometimes accidentally close the browser tab that pandora is running in. How do you get over this annoying little productivity suck?


**Option one**: Pony up for the pro version of pandora and run the desktop app. I could do this, but I’m fine with the advertisements.

**Option II**: Run a second Chrome window with just the pandora tab. The issue here is that when using CMD+tab to switch application focus, I’ll additionally have to hit the CMD+` to change browser windows. eww.

**Option best**: CLI PANDORA! There is a command line utility called `pianobar` available via homebrew that allows you to play pandora. No more accidentally closing a browser window. I can have either a split in tmux dedicated to pianobar, or a separate iTerm tab. To get started simply:

```bash
brew install pianobar
pianobar
```

It will prompt you for your credentials and then display a list of your stations. I haven’t used/needed any documentation because the interface is so intuitive. (`spacebar` to pause/play and `n` to skip to the next song).

Hope this comes in handy for you home row heroes out there! 🙂
