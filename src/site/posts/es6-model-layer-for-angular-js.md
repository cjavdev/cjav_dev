---
title: ES6 model layer for angular.js
date: 2015-01-19
---

Many of the so called MV* frameworks have some explicit support for a model layer. When working in backbone.js, the model layer is very clearly defined in Backbone.Model and Backbone.Collection.

Instances of Backbone.Model and Backbone.Collection interact with a rest api using $.ajax. In the world of backbone there is a lot of buy in to the evented architecture. When a model or collection finishes fetching, the instance publishes an event which listeners can then act on. They have clear #save, #create, #fetch methods that hit the server and update the model accordingly.

Since working with angular I’ve explored a few solutions (Restangular and $resource) for managing the model layer, but was left wanting. I feel like the designers of angular wanted to be a bit more flexible at the model layer and as a result didn’t build in much on top of plain-old-javascript-objects (POJO).

As a result Angular has a component called [Service](https://docs.angularjs.org/guide/services) which when injected into a function new’s up an instance of the Service object which might contain your custom logic for interacting with a backend API or with local storage.

I found myself repeating a lot of logic for each service and essentially rewriting much of the Backbone.Model class in my angular services. For example:

```js
myApp.factory('Workouts', function ($http, $q, loc) {
    function url(id) {
      if (id) {
        return loc.apiBase + '/workouts/' + id;
      }
      return loc.apiBase + '/workouts';
    }

    function Workout(attrs) {
      this.id = attrs.id;
      this.completed_date = attrs.completed_date;
      this.workout_sets = attrs.workout_sets;
    }

    return {
      all: function () {
        var dfd = $q.defer();
        $http.get(url()).then(function (resp) {
          var workouts = _.map(resp.data, function() {
            return new Workout(w);
          });
          dfd.resolve(workouts);
        }, function (resp, status) {
          $rootScope.$broadcast('event:auth-loginRequired', status);
          dfd.reject(resp.data);
        });
        return dfd.promise;
      },
      get: function (id) {
        var dfd = $q.defer();
        $http.get(url(id)).then(function (resp) {
          dfd.resolve(resp.data);
        }, function (resp) {
          dfd.reject(resp.data);
        });
        return dfd.promise;
      }
    };
  });
```

The all method here was essentially the same across all services in the system and only differed slightly in cases where I was massaging the incoming data.

@shawndromat pointed me towards a pattern where using a Model factory might help by returning a constructor function that I could use for each of my Model layer classes.

Here’s a simplified (without caching) version of my Model factory:

```js
myApp.factory('Model', function ($http, $q, $window, loc) {
  return function (options) {
    var path = options.path;
    var url = loc.apiBase + path;

    class Model {
      constructor(attrs) {
        this.setup.apply(this, arguments);
        attrs = attrs || {};
        this.attributes = {};
        this.set(this.parse(attrs));
        this.initialize.apply(this, arguments);
      }

      get id() {
        return this.attributes.id;
      }

      initialize() {
      }

      setup() {
      }

      set(attrs) {
        for(var attr in attrs) {
          this.attributes[attr] = attrs[attr];
        }
        return this;
      }

      get(key) {
        return this.attributes[key];
      }

      parse(response) {
        return response;
      }

      save() {
        if(this.id) {
          return this.update();
        } else {
          return this.create();
        }
      }

      update() {
        var dfd = $q.defer();
        $http
          .put(this.url(), this.attributes)
          .then((response) => {
            this.set(this.parse(response.data));
            dfd.resolve(this);
          }, (response) => {
            dfd.reject(this);
          });
        return dfd.promise;
      }

      create() {
        var dfd = $q.defer();
        $http
          .post(this.url(), this.attributes)
          .then((response) => {
            this.set(this.parse(response.data));
            dfd.resolve(this);
          }, (response) => {
            dfd.reject(this);
          });
        return dfd.promise;
      }

      url() {
        if(this.id) {
          return url + '/' + this.id;
        } else {
          return url;
        }
      }
    }

    Model.url = () => { return url; };

    var _all = [];

    Model.all = function () {
      $http.get(url, { cache: true }).then((response) => {
        _.each(response.data, (data) => {
          if(!_.any(_all, (m) => {
            return m.id === data.id;
          })) {
            _all.push(new Model(data));
          }
        });
      });

      return _all;
    };

    Model.create = function (attributes) {
      var model = new Model(attributes);
      _all.push(model);
      return model.save();
    };

    return Model;
  };
});
```

By injecting the Model class into other factories I can create constructor functions that override extend business logic, as well as extend interactions with the backend.

```js
myApp.factory('Workout', function (Model, WorkoutSet) {
  var Workout = Model({ path: '/workouts' });

  Workout.prototype.setup = function () {
    this.workout_sets = [];
  };

  Workout.prototype.parse = function (response) {
    if(response.workout_sets) {
      console.log('response has workout_sets');
      this.workout_sets = _.map(response.workout_sets, (s) => {
        return new WorkoutSet(s);
      });
      delete response.workout_sets;
    }
    return response;
  };

  return Workout;
});
```

I would love to hear your comments and suggestions regarding this implementation.
