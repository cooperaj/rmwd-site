---
title: Finagling Google Chrome to be a bit more Lion-y
date: 2011-07-23T17:18:19+00:00
author: adam
slug: finagling-google-chrome-to-be-a-bit-more-lion-y
tags:
  - google chrome
  - macos
  - osx lion
---

Figuring that I'd not written much up here lately I thought I'd better do something—anything—and so I write about making Google Chrome fit in a little better with the newly released OSX Lion.

<!--more-->
Lion introduces new swiping and multitouch gestures to your everyday experience, but unfortunately some of them clash with the gestures chosen by Chrome to move forward and backward in your browsing history. It used to be the case that swiping three fingers to the left would move back a page and to the right you'd end up going forward. Lion's new gestures conflict with this because a three finger swipe moves you between desktop spaces instead. Lion now prefers that when browsing you use two fingers to move between pages (1 if your using a Magic Mouse) but Chrome ignores these new fangled ideas and consequently feels awkward to use.

## What to do?

{{< figure src="images/Screen-Shot-2011-07-23-at-17.51.51.png" caption="Adding any number of gestures is dead easy.">}}

Fortunately there is a solution. A chap called [Andreas Hegenberg](http://blog.boastr.net/) created a wonderful application called [BetterTouchTool](http://www.boastr.de/BetterTouchTool.zip) that allows you to setup any number of arbitrary multitouch gestures and assign them to actions you'd like to perform. What we need to do is set it up so that swiping to the left and right with 2 fingers does the correct thing in Chrome and thankfully BetterTouchTool makes this a cinch.

  1. [Download the application](http://www.boastr.de/BetterTouchTool.zip) and drag it to your Applications folder. Then run it.
  2. Make sure to set it to run [when you login](images/Screen-Shot-2011-07-23-at-17.52.48.png) and if you like you can also [hide it from your dock](images/Screen-Shot-2011-07-23-at-17.52.52.png).
  3. From here you just need to add the gestures you want. [Click the plus button](images/Screen-Shot-2011-07-23-at-17.51.51.png) on the left hand pane and select Google Chrome. Then follow the instructions the application gives you.
  4. In order to get chrome to mimic Lion correctly you'll want to setup [gestures like these](images/Screen-Shot-2011-07-23-at-18.06.02.png).

Since I use a Magic Mouse as well as my touchpad I also replicated the mouse version of the gestures (single finger swiping) using the Magic Mouse section of BetterTouchTool.

Now my Google Chrome feels like a proper OSX Lion citizen—at least until they [fix the bug](http://code.google.com/p/chromium/issues/detail?id=78676) and it **is** a proper OSX Lion citizen.