---
title: Backbone rule learned during a JavaScript refactoring
date: 2015-02-25
---

One of my goals for 2015 is to up my typing speed. I’ve never been that great a typer and I’m currently averaging about 75 WPM and shooting for 100 WPM by the end of the year. As part of my goal I’ve been practicing with some really great web based type tutors, games and tools. If you’re interested in playing some online typing games for free, you should definitely checkout [typeracer](http://play.typeracer.com/) and [ztype](http://phoboslab.org/ztype/).

In the interest of building a tool and forwarding my goal I’ve created [WPM Challenge](http://wpmchallenge.com/). It’s a typing challenge similar to typeracer. I learned a couple interesting things while building this little application that I’m excited to share with you.

Some background: This project is built using Rails and Backbone. The real time stuff uses Pusher and the auth is mostly omniauth gems and some stuff in the User model.

This will be a story about some javascript refactoring. If you’d like to see the before and after check these commits out.

[track.js before](https://github.com/cjavdev/code_racer/blob/fac3c6a665890dfb10158c2a016b92f4afe47b31/app/assets/javascripts/models/track.js)
[track.js after](https://github.com/cjavdev/code_racer/blob/master/app/assets/javascripts/models/track.js)

My first stab at this problem used a Track backbone model, which represented the content being typed. This quickly attracted many other functions and ended up being a junk drawer of functionality, handling, joining new cars to the track, as well as about a dozen method that were delegated to an instance of WordChecker, who’s responsibility it is to manage current state of the typer as they advance through the content. At first I didn’t write any tests, in fact this wasn’t intended to be a real time collaborative typing challenge at all. At some point I decided it would be cool to race my friends and keep track of WPM for each track.

I admittedly wrote zero javascript tests at the beginning and was quite fearful of making this big refactoring. In a later post I’ll talk about how I used the teaspoon gem to get up and running writing tests for javascript pretty quickly in Rails, but for now, know that I just started adding javascript tests at the start of this refactoring.

## The problem

The problem was that the `TrackDetail` view and the Track model were taking on way too much responsibility. These problems manifested themselves in two ways. 1) I found this super odd code smell where the Track model was delegating more than half of its methods down to a WordChecker. I think the goal here was to keep the word checking logic abstracted away from the view as much as possible, but in the end the view was calling a handful of wordChecker methods just on the Track. IMO pretty shitty.

### Smell 1: Feature Envy

```js
// app/assets/javascripts/models/track.js
CodeRacer.Models.Track = Backbone.Model.extend({
  // ...
  currentWordCount: function () {
    return this.wordChecker().currentWordCount();
  },

  checkWord: function (word) {
    return this.wordChecker().checkWord(word);
  },

  checkLetter: function (letter) {
    return this.wordChecker().checkLetter(letter);
  },

  wordComplete: function (word) {
    return this.wordChecker().wordComplete(word);
  },

  backSpace: function () {
    return this.wordChecker().backSpace();
  },

  content: function () {
    return this.wordChecker().render();
  },

  moreWords: function () {
    return this.wordChecker().moreWords();
  },

  wordCount: function () {
    return this.wordChecker().wordCount();
  },

  percentComplete: function () {
    return this.wordChecker().percentComplete();
  },
  //...
```

### Smell 2: Too much setup in View#initialize

2) The TrackDetail initialize method also became super gross. It was initializing a ton of objects and doing a lot of setup for the race. Check it out:

```js
CodeRacer.Views.TrackDetail = Backbone.View.extend({
  initialize: function () {
    this.listenTo(this.model, 'sync', this.render);
    this.timer = new CodeRacer.Models.Timer();
    this.model.join(this.timer); // joins the race as the current user and sets up pusher channel
    this.carsIndex = new CodeRacer.Views.CarsIndex({
      collection: this.model.cars()
    });
    this.timerView = new CodeRacer.Views.TrackTimer({
      timer: this.timer,
      track: this.model
    });
    this.listenTo(this.timer, 'go', this.startRace);

    this.leaderBoardView = new CodeRacer.Views.LeaderBoard({
      collection: this.model.leaders()
    });
  },
  // ...

```

### Something better

In my Rails controllers, I’ve been trying to follow the rules laid out by Sandi Metz in a Ruby Rogues episode a few months back. When attempting to keep methods short and keep only one instance variable per controller I’ve noticed that my views and controller actions are simpler, but more interestingly a lot of the logic is pushed into new ruby objects that do not fall into the Rails architecture. Some people call these service objects, call them what you want to, they’re just objects. My new found confidence in creating objects outside of the framework has led me to create two new classes in this project that do not live directly in the Backbone architecture, but provide great encapsulation of my data an business logic.

The rule I’ve discovered during this extraction: Only refer to one model or collection in a backbone view. I extracted logic from the TrackDetail view and from the Track model and put them in a class called Race. The Race class expects a track, timer, and a wordChecker and is the one thing that the view refers to. It handles working with the word checker and forwards/delegates events raised from the Track or from the Timer object. Check it out:

New Race class. Notice the dependency injection, made this especially testable 🙂

```js
CodeRacer.Models.Race = function (track, timer, wordChecker) {
  this.track = track;
  this.timer = timer;
  this.wordChecker = wordChecker;
  this._valid = true;

  this.listenTo(track, 'change:content', function () {
    this.wordChecker.setContent(track.get('content'));
  });
  this.forwardEvents();

  track.fetch();
  track.join(timer);
};

CodeRacer.Models.Race.prototype = {
  forwardEvents: function () {
    this.listenTo(this.track, 'sync', function () {
      this.trigger('sync');
    });

    this.listenTo(this.timer, 'go', function () {
      this.trigger('go');
    });

    this.listenTo(this.wordChecker, 'over', function () {
      this.over();
    });

    this.listenTo(this.wordChecker, 'next', function () {
      this.next();
    });
  },

  over: function () {
    this.track.notify(this.wpm(), this.wordChecker.percentComplete(), true);
    this.timer.stop();
    this.trigger('over');
  },

  cars: function () {
    return this.track.cars();
  },

  leaders: function () {
    return this.track.leaders();
  },

  content: function () {
    return this.wordChecker.render();
  },

  checkWord: function (word) {
    this._valid = this.wordChecker.checkWord(word);
    return this._valid;
  },

  valid: function () {
    return this._valid;
  },

  wpm: function () {
    if (this.started() && this.timer.seconds > 1) {
      return (this.wordChecker.currentWordCount() / (this.timer.seconds / 60)).toFixed(2);
    }
    return 0;
  },

  next: function () {
    this.track.notify(this.wpm(), this.wordChecker.percentComplete());
    this.trigger('next');
  },
};

_.extend(CodeRacer.Models.Race.prototype, Backbone.Events);
```

TrackDetail refactored to use only one thing.

```js
// app/assets/javascripts/views/track_detail.js
CodeRacer.Views.TrackDetail = Backbone.View.extend({
  initialize: function (options) {
    this.race = options.race;
    this.listenTo(this.race, 'sync', this.render);
    this.listenTo(this.race, 'go', this.startRace);
    this.listenTo(this.race, 'next', this.advanceWord);
    this.listenTo(this.race, 'over', this.gameOver);
    this.initializeSubviews();
  },

  advanceWord: function () {
    this.renderContent();
    this.clearInput();
  },

  initializeSubviews: function () {
    this.carsIndex = new CodeRacer.Views.CarsIndex({
      collection: this.race.cars()
    });

    this.timerView = new CodeRacer.Views.TrackTimer({
      race: this.race,
      timer: this.race.timer, // probably not necessary anymore
      track: this.model // probably not necessary anymore
    });

    this.leaderBoardView = new CodeRacer.Views.LeaderBoard({
      collection: this.race.leaders()
    });
  },
  // ...
```

I think the end result is much cleaner, and now that I’ve got some test coverage on WordChecker and Race, I’m much more confident in making changes. Also, moving forward and adding features, subViews to the TrackDetail view will be a breeze.
