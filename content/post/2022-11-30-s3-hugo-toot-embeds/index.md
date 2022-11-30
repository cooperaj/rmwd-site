---
author: adam
coverimage:
date: 2022-11-30T15:35:18Z
description: Some shortcode magic for embedding toots in Hugo posts - not using oembeds
month: "2022/11"
tags: 
- mastodon
- fediverse
- hugo
- tech
title: "Some shortcode magic for embedding toots in Hugo posts."
slug: "2022-11-30-s3-hugo-toot-embeds"
year: "2022"
---

After a bit of work with [Hugo's](https://gohugo.io) templating functions, namely the exceedingly useful `getJSON` I can now embed Mastodon posts directly in my page!  

{{< toot id="109433723069982233" >}}

If you've looked at this before you might be thinking "Gee, this is easy, you just use the [Oembed API](https://docs.joinmastodon.org/methods/oembed/)". Well, I didn't want to use that so this does it properly, with building actual content out of JSON responses. It does mean I'm in way more control of the behaviour.

<!--more-->

### Things it does

  1) Looks quite a lot like a Mastodon post
  2) Custom server emoji's
  3) Link's to all the right places
  4) Works for any post your instance is aware of

### Things it doesn't do (yet?)

  1) Images or image galleries
  2) Content Warnings (it just straight up shows the content)

### Things you may want to know

  1) It pulls the data at build time, so if anything changes it's not updated till the next time the Hugo site is rebuilt.
  2) The CSS is pretty custom to this theme, you can [find it on github if you really want a look](https://github.com/cooperaj/rmwd-hugo-theme/blob/master/assets/sass/_toot.scss)

You can find the shortcode template [on github](https://github.com/cooperaj/rmwd-hugo-theme/blob/master/layouts/shortcodes/toot.html) and to use it on my pages I just have to add `{{</* toot id="long_numeric_id_of_post" */>}}`

