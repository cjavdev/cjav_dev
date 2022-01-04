---
title: Tailwind UI menu with stimulus.js and Rails
date: 2022-01-11
---

This assumes you've already got a Rails application with Tailwind CSS setup and you're using Tailwind UI.


1. Copy the Application layout that you like and update application.html.erb
2. Generate the stimulus controller

```shell
bin/rails g stimulus menu
```

That'll create `app/javascript/controllers/menu_controller.js`

In order to use that controller, we need to mount it to our HTML element we
want to control by adding `data-controller="menu"`:

```html
<!-- Profile dropdown -->
<div data-controller="menu" class="ml-3 relative">
  <div>
    <button type="button" class="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" id="user-menu-button" aria-expanded="false" aria-haspopup="true">
      <span class="sr-only">Open user menu</span>
      <img class="h-8 w-8 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
      <!-- ... -->
```

Add the `hidden` class to the dropdown menu content:

```html
<div data-controller="menu" class="ml-3 relative">
  <!-- ... we're still inside that profile dropdown menu thing, see `hidden` on the next line? -->
  <div class="   hidden    origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1">
    <a href="/settings" class="block px-4 py-2 text-sm text-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-1">
      Settings
    </a>

    <a href="/users/sign_out" class="block px-4 py-2 text-sm text-gray-00" role="menuitem" tabindex="-1" id="user-menu-item-2">
      Sign out
    </a>
  </div>
</div>
```

Now we want to add an action to the button so that when it's clicked, we toggle the `hidden` class.

```js
// app/javascript/controllers/menu_controller.js

import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="menu"
export default class extends Controller {
  connect() {
    console.log("menu controller connected")
  }

  toggleDropdown() {
    // add or remove the `hidden` class from the dropdown content...
  }
}
```

Now we can execute the `toggleDropdown` action by adding a `data-action` attribute to the button:

```html
<div data-controller="menu" class="ml-3 relative">
  <div>
    <button data-action="menu#toggleDropdown" type="button" class="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" id="user-menu-button" aria-expanded="false" aria-haspopup="true">
      <span class="sr-only">Open user menu</span>
      <img class="h-8 w-8 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
    </button>
  </div>

  <!-- ... -->
```

Next we need to wire up the *target* so that the controller knows which element to show or hide.

That's done by adding a `data-menu-target="dropdown"` to the content of the dropdown:

```html
<div data-controller="menu" class="ml-3 relative">
  <!-- ... we're still inside that profile dropdown menu thing, see `hidden` on the next line? -->
  <div data-menu-target="dropdown" class="   hidden    origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button" tabindex="-1">
    <a href="/settings" class="block px-4 py-2 text-sm text-gray-700" role="menuitem" tabindex="-1" id="user-menu-item-1">
      Settings
    </a>

    <a href="/users/sign_out" class="block px-4 py-2 text-sm text-gray-00" role="menuitem" tabindex="-1" id="user-menu-item-2">
      Sign out
    </a>
  </div>
</div>
```

And adding it to the list of targets for the controller:

```js
export default class extends Controller {
  static targets = ["dropdown"];
  // ...
```

Now we can implement our `toggleDropdown` action:

```js
import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="menu"
export default class extends Controller {
  static targets = ["dropdown"];

  connect() {
    console.log("menu controller connected")
  }

  toggleMenu() {
    this.dropdownTarget.classList.toggle("hidden")
  }
}
```
