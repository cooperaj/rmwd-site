---
author: adam
coverimage: cover.jpg
date: 2024-03-26T11:26:00Z
description: "My 2023 hobby roundup, in which I detail I was rubbish at it."
month: "2024/03"
tags: 
- mastodon
- twitter
- fediverse
- dokku
- devops
- tech
title: "Populating my single user Mastodon instance"
slug: "populating-my-mastodon-instance"
year: "2024"
---

{{< callout >}}
<strong>Problem:</strong></br>
Your single user (or otherwise small) Mastodon server doesn't have much content on it. Your followed \#hashtags don't seem to bring in much and you resort to browsing big instances to find new people or content that you're interested in.

<strong>Solution:</strong></br>
This post.
{{< /callout >}}

I recently toot'd[^1] that despite having a decent set of "followed" hashtags on my instance I just wasn't seeing any content coming in for them. This was frustrating me and having done a bit of investigation into how [ActivityPub](https://www.w3.org/TR/activitypub/) functions turns out is _just the way it is_ ™️. 

{{< toot id="112150318094469164" >}}

<!--more-->

Thanks to some of the responses of my toot I found there are some solutions to this issue. They're not perfect by any means but having implemented them on my [Dokku hosted instance](/2022/11/running-your-own-mastodon-instance/) I now have **much** more relevant content coming in and it's given a new lease of life to my home feed.

### There're tools that can help

[FediFetcher](https://github.com/nanos/FediFetcher) - I've been running this for quite a while now. It's a tool that you can run in a variety of ways to populate the replies of the remote posts on your instance. If you've ever wondered why your home feed items have no/few replies yet when you browse that item on it's original server it's got loads; this is something that FediFetcher can help to alleviate. It does this by checking the original server, fetching that list of replies and then instructing your server to go get them. 

But that doesn't help the \#hashtags. For that you need a couple of other things, namely [FakeRelay](https://github.com/g3rv4/FakeRelay) and its partner application [GetMoarFediverse](https://github.com/g3rv4/GetMoarFediverse). These work by grabbing your followed \#hashtags and searching instances of your choosing for them (probably something big like [mastodon.social](https://mastodon.social) or more focused like [warhammer.social](https://warhammer.social))

### Getting them running

I've put together a small repo that should help in getting all these tools running on your Dokku instance. That said, with a bit of work, you should be able to have them all functioning anywhere. Both Fedifetcher and GetMoarFediverse support running as Github actions in addition to docker containers or plain applications.

In short the steps are:
  1. Get a fake relay running
  2. Generate some access tokens for your Mastodon
  3. Schedule the running of the tools to fetch posts on a schedule.

Here are the things you'll need to know:

  * _YOUR_FAKE_RELAY_HOST_ - FakeRelay needs to be on a publicly accessible domain e.g. "__fakerelay.example.com__".
  * _YOUR_DOKKU_HOST_ - The host on which you have dokku installed.
  * _YOUR_MASTODON_HOST_ - The domain under which you access your mastodon instance e.g. "__mastodon.example.com__".

#### Installation Steps

First we need to setup the FakeRelay app.

```shell
# on ${YOUR_DOKKU_HOST} create a fakerelay dokku application. 
# I name them using the domain name as that allows us to skip the step 
# where we manually set that.
$ dokku apps:create ${YOUR_FAKERELAY_HOST}
```

The next steps will be run on whatever machine will end up running your fetcher tools

```shell
# checkout the code somewhere on your 24/7 machine (dokku host, other server).
$ git clone https://github.com/cooperaj/FetchMoreFediverse
$ cd FetchMoreFediverse

# hook our local repo up to dokku.
$ git remote add dokku dokku@${YOUR_DOKKU_HOST}:${YOUR_FAKERELAY_HOST}

# the container needs some storage (you can name this what you like, 
# I tend to use the application name with hyphens e.g. "fakerelay-example-com").
$ dokku storage:ensure-directory fakerelay-storage
$ dokku storage:mount /var/lib/dokku/data/storage/fakerelay-storage:/data

# configure the container to start in configuration mode. 
$ dokku config:set DOKKU_DOCKERFILE_START_CMD="config\ ${YOUR_FAKERELAY_HOST}"

# deploy our app. this will fail but will successfully create
# the configuration files.
$ git push dokku main
```

You may be confused as to why the above command failed but what you've done at this point is prompt the fakerelay application to create its configuration files in your mounted storage. You can verify this is the case by taking a look at the `/var/lib/dokku/data/storage/fakerelay-storage` folder on your dokku host.

```shell
# configure the container to run as a web service
$ dokku config:set DOKKU_DOCKERFILE_START_CMD="web"

# redeploy our app
$ git push dokku main

# don't forget ssl support
$ dokku letsencrypt:enable ${YOUR_FAKERELAY_HOST}
```

At this point you should be able to visit `https://${YOUR_FAKERELAY_HOST}` in a browser and see the text _Hi! I'm FakeRelay..._

#### Key Generation

Now we need to register an application with the relay. This will give us a unique token that _GetMoarFediverse_ will use to tell our Mastodon instance of urls it needs to fetch. 

```shell
# make sure you take a note of the key that this command returns. 
# You *will* need it later. This page will refer to this 
# as ${YOUR_FAKERELAY_KEY}
$ dokku run instance add _YOUR_MASTODON_HOST_
 ```

Additionally we're going to need a couple of access tokens from your Mastodon instance. These will allow both the FediFetcher and GetMoarFediverse tools to interrogate your user account for the information they need (such as what posts or \#hashtags need fetching).

{{< figure src="images/settings.png" title="Navigate to the development applications page in your Mastodon settings and click 'New application'" alt="A screenshot of the development applications page of the Mastodon settings. The 'Development' menu item and 'New application' button are highlighted with 'Click here' and 'then here' respectively" class="image" caption="Navigate to the development applications page in your Mastodon settings and click 'New application'" >}}

 1. Navigate to your instances development applications page `Preferences > Development`
 2. Click the `New application` button
 3. Enter `GetMoarFediverse` as the name
 4. Deselect all scopes apart from `read:follows`
 5. Click `submit`
 6. The key will be available as the `Your access token` value when you view the `GetMoarFediverse` application. The page will refer to it as `${YOUR_MOAR_TOKEN}`

**Repeat** the above steps for the `FediFetcher` application but leave only `read` and `admin:read:accounts` seclected for the scopes. This document will refer to this as `${YOUR_FEDI_TOKEN}`

#### Add the relay to Mastodon

{{< figure src="images/relays.png" title="Navigate to the relay page in your Mastodon settings and click 'Add new relay'" alt="A screenshot of the relay page of the Mastodon settings. The 'Administration' and 'Relays' menu items are highlighted with 'Click here' and 'then click here' respectively. The 'Add new relay' button is highlighted with the text 'finally, here'" class="image" caption="Navigate to the relay page in your Mastodon settings and click 'Add new relay'" >}}

 1. Navigate to your instances relay page `Preferences > Administration > Relays`
 2. Click the `Add new relay` button
 3. Enter `https://${YOUR_FAKERELAY_HOST}/inbox` as the URL for your relay inbox 
 5. Click `Save and enable`

#### Tool configuration

In your checked out repo each tool has a `config.json.dist` file under its respective `data/toolname` folder. You'll need copy these as `config.json` and edit with the values you'll have picked up as you've followed the above steps, ensuring you use the correct keys as you go.

Both the tools have a whole bunch of tweakable settings you can put in these files. The ones I have in there work for me but feel free to change them to suit you. Your best bet for documentation on these is the respective github repos [FediFetcher](https://github.com/nanos/FediFetcher) and [GetMoarFediverse](https://github.com/g3rv4/GetMoarFediverse).

#### The First start

Once you've got everything configured how you like you can start up both tools for a single run. This can take some time initially as they will both be pulling a large number of toots from the fediverse. Subsequent runs will be much quicker as you won't be pulling any toots that you've already seen.

```shell
# bring up both tools
$ docker compose up -d

# then if you want to watch them work
$ docker compose logs -f
```

At some point both containers will exit as they'll have finished. Now you just need to setup some sort of automation so they run on a schedule. 

#### Scheduling repeat runs

This one is fortunately quite easy on a linux system - just use cron! This is what I've got in mine

```shell
$ crontab -e

# add these lines at the bottom (ensure the compose file location is accurate)
3,18,33,48 * * * * /usr/local/bin/docker-compose -f /root/src/FetchMoreFediverse/docker-compose.yml start fedifetcher > /dev/null 2>&1
10,25,40,55 * * * * /usr/local/bin/docker-compose -f /root/src/FetchMoreFediverse/docker-compose.yml start getmoarfediverse > /dev/null 2>&1
```

It runs each tool every 15 minutes roughly offset from each other so that they shouldn't run at the same time (hopefully). Alternatively you could probably fashion something using _systemd_.

### You're done!

If everything went to plan you should now start seeing _way_ more content in your home feed. Any hashtags that you follow will suddenly be worth it since they'll actually contain posts! When you go to comment on something you'll be able to see that someone beat you to it this time (or that they were wrong). Conversations are actually able to happen.

[^1]: The act of posting on Mastodon being called a "toot" is a hill I'm willing to ~~die on~~argue strongly for.