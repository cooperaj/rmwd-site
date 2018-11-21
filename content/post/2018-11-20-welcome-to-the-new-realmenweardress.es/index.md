---
author: adam
coverimage:
date: 2018-11-20T10:15:30+01:00
description: This was the year I took some time out to rebuild this site. As is typical for the personal projects we take on it featured large amounts of scope creep, a non-existant deadline and too many new technologies to learn.
month: "2018/11"
tags: 
- devops
- hugo
- dokku
- docker
- laravel-mix
- bulma
title: "Welcome to the new Real Men Wear Dress.es"
year: "2018"
---

This was the year I took some time out to rebuild this site. As is typical for the personal projects we take on it featured large amounts of scope creep, a non-existant deadline and too many new technologies to learn.

## Where I came from

The original incarnation of this site was a WordPress instance. It used a [theme](https://wordpress.org/themes/oulipo/) that I'd forked from one I'd found whilst rummaging around on [github](https://github.com) and a number of plugins to otherwise improve the site. I was pretty proud of my efforts to be honest. I had it running on a standard [LEMP](https://lemp.io) [Linode](https://www.linode.com) VPS which I'd setup with a bunch of custom [Ansible](https://ansible.com) playbooks. It was deployed into a folder and I mostly let it take care of itself by giving it all the horrendous write permissions that it asked for.

But things move on, and some 8 years later I chose to rebuild it all.

<!--more-->

## Tech Stack

{{% callout %}}
  *T.L.D.R.* The full site source and theme is available on Github [here](https://github.com/cooperaj/rmwd-site) and [here](https://github.com/cooperaj/rmwd-hugo-theme).
{{% /callout %}}

Because I can't help but play with all the new(ish[^1]) stuff heres a list of what I played with to get the site up and running as you see it now.

  * [Hugo](https://gohugo.io) &mdash; Because static sites are all the rage and I've been [tinkering](https://github.com/cooperaj/starling-coinjar) with [golang](https://golang.org).
  * [Webpack](https://webpack.js.org) &mdash; Who doesn't like compiling frontend.
    * SASS &mdash; I want my CSS to be indented and with variables.
    * ES6 JS &mdash; I don't need no stinking jQuery.
    * [Laravel Mix](https://laravel-mix.com) &mdash; Because I'm not a sadist.
  * Responsive images &mdash; I want my mobile load times to be tiny and my desktop images to be gorgeous. 
  * [Bulma](https://bulma.io) &mdash; A mobile-first flexbox CSS framework that lets me get my SASS on, without getting in the way.
  * [Docker](https://docker.com) &mdash; Everyones favourite container format.
  * [Dokku](http://dokku.viewdocs.io/dokku/) &mdash; A silly simple way for me to get things live with minimal effort

I'll briefly go over some of these things in this post but will be putting together some more in-depth articles in the near future.

## Hugo

Hugo is a static site generator written in Go. What this means is that I write a whole bunch of [markdown](https://daringfireball.net/projects/markdown/). I run a binary application and out pops a website like you'd write in the old days (some html, a few images and a stylesheet). Serving static files to end users is *fast*, depending on the webserver (I went with Nginx) you're looking at load times of under 20ms for your pages. With some work put into the mobile side of things you can get a full page, including all the assets, loaded in under 150ms[^2].

I've had to lose a few features WordPress offered, or rather the plugins I'd installed did, since Hugo doesn't offer any kind of runtime customisation but I don't think I'm going to miss them &mdash; if I want to pimp my post on Twitter I can do that manually now.

Another thing that needed doing was the export/import of the 8 years worth of content that I'd built up. This proved a little time consuming but not really all that tricky. The procedure went something like;

  1. Export from WordPress into Jekyll
  1. Run the Hugo Import from Jekyll Tool
  1. Fix all the horrible translation issues

## Site design

I don't know when or how I came across Bulma but when I started building the site I remembered it and gave it a bit of investigation. Bulma provides a class only way of styling your page with no impact on the styles of HTML elements outside of a couple of use cases. This results in some fairly class heavy HTML code but you can reduce that with judicious use of SASS mixins. Bulma is also pretty modular and you can include (or not) components as you need. In the [_bulma.scss](https://github.com/cooperaj/rmwd-hugo-theme/blob/master/assets/sass/_bulma.scss) file you can see that I'm not using even half of what's offered.

One of the things I knew I wanted to tackle was a full Webpack based compilation/build system. This tends to come with a laundry list of side tasks that you need to complete to get a functional build and development environment but I wanted to avoid as much of that as possible so I brought in Laravel Mix instead. This offers a full Webpack environment with all the development niceties but it wraps it up in a super simple fluent wrapper that gives me all the benefits and hides all the horrendous configuration that Webpack normally entails.

{{< highlight javascript >}}
mix.options({
    ...
    })
    .sass('assets/sass/main.scss', 'css/')
    .js('assets/app.js', 'javascript/')
    .copyDirectory('assets/icons', 'static/')
    .copyDirectory('assets/images', 'static/images')
    .sourceMaps()
    .browserSync('localhost:1313')
    .setPublicPath('static/')
    .setResourceRoot('/');
{{< /highlight >}}

The stripped down code above shows you the basics. As you can see above I've managed to setup a full asset compilation pipeline, with prefixing, source maps and a [browsersync](https://www.browsersync.io) instance in the 30 or so lines of javascript you can find in the [full file](https://github.com/cooperaj/rmwd-hugo-theme/blob/master/webpack.mix.js).

The final piece of the puzzle for me was having appropriately sized images in my pages. If I'm on a mobile I want to see crisp images but they shouldn't take ages to download, they should also be crisp on my much larger screened desktop. Responsive images are the solution. I can use `src-set` and `sizes` in my html to tell my browser to fetch alternative image sizes from the server but I also need a way to generate those image sizes with Hugo. Handily this isn't made [too hard](https://gohugo.io/content-management/image-processing/);

{{< highlight go-html-template >}}
<!-- image: my_image.jpg  -->
{{- $image := .Params.image -}}
{{- $resource := .Page.Resources.GetMatch (printf "*%s*" $image) -}}
{{- $smallResource := $resource.Resize "500x Lanczos" -}}
{{- .Scratch.Set "s-imgSrc" $smallResource.RelPermalink -}}
<!-- 
Scratch s-imgSrc contains:
http://blog/post/my-post/my_image_hude771472e2c4ddbc795ca7336aa17edc_3732651_500x0_resize_q75_lanczos.jpg 
-->
{{< /highlight >}}

This code will take the image parameter from a pages [front-matter](https://gohugo.io/content-management/front-matter/) data area and processes it into a new size. Using it in your templates is then as simple as printing the image url saved in the [`.Scratch` area](https://gohugo.io/functions/scratch/#readout). I use this technique in a number of places but the best example is the custom [`figure` shortcode](https://github.com/cooperaj/rmwd-hugo-theme/blob/master/layouts/shortcodes/figure.html).

## Hosting it all

After designing and building all this I wanted to host it somewhere that would involve minimal fuss on my part. I've been using [Scaleway](https://scaleway.com) as a personal VPS provider for a while now. Although they're limited in locations they offer some of the best bang for your buck[^3] you'll find. For incredibly reasonable money I'm running a 4 core 8GB ram dedicated server[^4] which allows me to run some pretty resource intensive software - they make great CI build agents.

I build and maintain this server with a series of custom Ansible playbooks which would probably have gotten me all the way to running the site had I wanted to but instead I went with an opensource project called Dokku. Dokku is a single host PAAS implementation that builds on top of Docker. It works in a very similar fashion to, and in-fact operates using, [heroku](https://heroku.com) components. What this means is that I push code changes to a git repo and this service recognises that, pulls the changes, builds them using appropriate technologies (buildpacks) and then deploys the result as a functioning and routed to docker container. In all honesty it's a bit like magic&hellip; and I love it.

But, I don't want to use buildpacks for this site, that would be too easy. So I used some of the advanced functionality that Dokku offers and have it build my site using the automatically recognised Dockerfile at the [root of the site](https://github.com/cooperaj/rmwd-site/blob/master/Dockerfile). This puts me in full control of the build process and results in a release of new site content that looks something like;

{{< highlight bash >}}
$ git push dokku
{{< /highlight >}}

## Conclusion

At the end of the day this is just a small blog telling the world about the things that I do. I took the oportunity here to expand on my knowledge of all sorts technologies and I think the result is a website thats far, far better than the one it replaced.

[^1]: Well, okay, some of it isn't quite so new but the outgoing site was 8 years old!
[^2]: This is entirely dependant on your site and its content. These numbers are what *I'm* achieving.
[^3]: Insert currency unit of choice here.
[^4]: It's likely a single board computer or blade in a rack of hundreds. But it is my own dedicated hardware.