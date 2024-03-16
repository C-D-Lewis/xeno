# xeno

Lightweight Reddit browser.

![](assets/screenshot.png)

## Features

* Search bar for any subreddit or username.
* Reddit OAuth login.
* Drawer with list of user's subscribed subreddits.
* Settings page with options and rate limit usage summary.
* Either list or gallery display modes.
* Multiple sort modes.
* Notation when a post is new since last reload.
* Collapsible comment tree.
* Navigation by post author or subreddit name.
* Simple inline image and video where extractable.
* Subscribe/unsubscribe from subreddits.

## Setup

Install dependencies:

```
npm ci
```

Setup `env.js` file using credentials from
[Reddit apps prefs](https://old.reddit.com/prefs/apps/):

```js
window.CLIENT_ID = '';
window.CLIENT_SECRET = '';
window.REDIRECT_URI = '';
```

## Run

Build and run:

```
npm start
```
