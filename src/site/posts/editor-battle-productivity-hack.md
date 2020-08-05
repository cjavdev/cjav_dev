---
title: Editor battle + productivity hack!
date: 2015-01-08
---

Over my decade of development I’ve used many different text editors. In the very beginning, I didn’t know better and used notepad.exe. At my first paid programming gig in 2005 we used Sun Solaris machines and I was thrown into the deep end with a book on Perl and a book on Vi. I became proficient enough to get things done in VI, but was mostly lost. That same year I was introduced to Visual Studios. Later for school I used notepad++, Dev-C++ and, as infrequently as possible, nano.

Most of my development between 2007 and 2012 was done on windows based machines writing code for the web in Visual Studios. In 2012 I bought a Mac that would become my primary development machine. In the process of switching over to Mac I’ve experimented with a handful of editors an eventually settled on one.

In my experience Visual Studios is hands down the most powerful editor out there. It is incredibly feature rich. When I use VS I feel like I’m only ever actually using about .5% of what it can really do. I’ve used XCode for some iOS development and I would categorize XCode and Visual Studios together as full IDE’s. XCode is no where near as featureific as Visual Studios, but still has far more features than I’ll ever consider using.

I spent about 4 months working with Textmate 2 and found it to be straight forward and useful. I liked some of the integrations allowing me to run code directly from the editor. I also liked the powerful built in snippet library provided.

After Textmate I considered Sublime text for 1 month. It has very similar features to Textmate and the way I used them was identical except for subtle differences in snippets.

After using Sublime for a month I attempted to use Vim as my primary editor for a month. At first I hated it. I didn’t really understand the “modal” editing and was using the arrow keys in insert mode most of the time. It seemed like a more frustrating version of Sublime or Textmate.

About a month after starting to use Vim I received an offer to try the Atom beta. I used atom for about 2 weeks before deciding that it too was extremely similar to Textmate and Sublime.

There must be a reason that developers prefer Emacs and Vim, I thought. (I opened emacs once and spent 10 min figuring out how to properly close it, maybe one day I’ll give her another solid try). After some research I realized I was using Vim all wrong. I was implementing every anti-pattern in the book: staying in insert mode, using arrow keys to navigate, holding down backspace to delete a word or line. I learned a few rules of thumb that took my editing to the next level with Vim:

1. Spend as little time as possible in `insert` mode.
1. Don’t use arrow keys, prefer h, j, k, l.
1. Don’t hold down any key for any reason, ever.
1. Navigate with numbers.
1. Compose motions and operators.

I’m constantly trying to get faster. Sharpening my tools. I recommend you try Vim and try to follow the above rules. The best tip for getting more efficient: **Turn off key repeat!**

By turning off key repeat at your operating system level, you’ll be forced to learn all the keyboard shortcuts for every other application you use. Turning off key repeat for a couple weeks drastically increased my overall productivity.
