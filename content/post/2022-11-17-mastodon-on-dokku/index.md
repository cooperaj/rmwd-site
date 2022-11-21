---
author: adam
coverimage: cover
date: 2022-11-17T13:58:18Z
description: This post is going to describe the steps I took to spin up my own Mastodon instance. It assumes technical knowledge (but hopefully not too much), and some pre-existing things.
month: "2022/11"
tags:
- mastodon
- twitter
- fediverse
- dokku
- devops
- tech
title: "Running your own Mastodon instance (Using Dokku)"
slug: "running-your-own-mastodon-instance"
year: "2022"
---

## The great #TwitterMigration

{{<callout>}}
  __Document Versions__

  <table class="table">
    <tbody>
      <tr>
        <td>18th&nbsp;Nov.&nbsp;2022</td>
        <td>Initial version.</td>
      </tr>
      <tr>
        <td>21st&nbsp;Nov.&nbsp;2022</td>
        <td>
          Missing proxy ports setting added. Thanks <a href="https://brunty.social/@brunty">@brunty@brunty.social</a>.<br/>
          Added missing file upload limit.
        </td>
      </tr>
    </tbody>
  </table>
{{</callout>}}

<!--start-summary-->

If you're a [Twitter](https://twitter.com) user (and even if you're not) you may be aware that it was recently [acquired by one Elon Musk](https://www.wired.com/story/elon-musk-owns-twitter-deal/). You may also be aware that he's gone on a cost cutting rampage that has left people concerned for the future of the platform as mass layoffs and publicised technical changes have [resulted in broken functionality](https://twitter.com/UberMenchies/status/1592261486923382784) or [massive shareholder losses](https://www.forbes.com/sites/marisadellatto/2022/11/10/eli-lilly-clarifies-its-not-offering-free-insulin-after-tweet-from-fake-verified-account-as-chaos-unfolds-on-twitter/).

There is a Twitter alternative, just one amongst many, called [Mastodon](https://getmastodon.org). It's a part of something called the Fediverse; which is a silly word that fundamentally groups a large number of applications around something called the [ActivityPub](https://en.wikipedia.org/wiki/ActivityPub) protocol. In brief it's a well defined method for clients and servers to talk to each other about people and what they're doing. Which is why, over the last few weeks, Mastodon servers (or instances) have seen a massive spike in new user accounts and usage. People are migrating and instance owners have been scrambling to scale up their infrastructure to cope.

You can always join one of the [many instances available](https://www.fediverse.to/), or, like I did you can run your own[^1].

<!--more-->

## Getting it running
This post is going to describe the steps I took to spin up my own Mastodon instance. I chose not to use [one of the many hosting services](https://masto.host/) available that will spin you up an instance with one click. It assumes technical knowledge (but hopefully not too much), and some pre-existing things.

### Prerequisites
You will need a number of things to get running;
  1. An appropriately resourced VPS (or any other kind of server). It is possible to run a single user instance [on a RaspberryPi 4](https://raspberrypi.social/@lizupton@mastodon.social/109314449592189188). My instance is running great on a 2vCPU 4GB VPS, it could probably handle more than just me.
  2. A domain name pointed at that VPS.
  3. An installation of Dokku on that VPS.

#### Dokku
[Dokku](https://dokku.com) is a drop in replacement for Heroku that you can run on your own server. I use it for hosting pretty much everything (including this site). Things about Dokku I really like include;

  1. Automatic SSL - you just set an email and turn it on.
  2. Building from Dockerfiles - I use [Docker](https://docker.com) all the time so this makes things super convenient, but it also supports auto-discovery of your apps type, just like Heroku.
  3. `git push dokku` - your thing is on the internet.

I won't go over too many of the details in getting Dokku running as there are [excellent docs available](https://dokku.com/docs/getting-started/installation/). Failing that some VPS providers even include [1-click installs](https://marketplace.digitalocean.com/apps/dokku). 

I'll be using Dokku throughout this post. Specifically I've made sure I have the [local client](https://dokku.com/docs/deployment/remote-commands/#official-client) installed and setup so that I can run server level commands locally.

You'll also need a couple of service plugins (namely PostgreSQL and Redis). I'll detail the installation of those later.

## Lets go
Because I only want to run an instance for myself I'm in no need to scale it horizontally. So for that reason I can use the [LinuxServer.io Mastondon image](https://github.com/linuxserver/docker-mastodon/). This image gives us a single Docker container that contains everything we need to run the Mastodon application (minus the database and cache services) so makes our life super easy.

### Assumptions
If you're following these instructions you will be using a lot of your own information so, to that end, anywhere you see something like `${YOUR_*}` you'll need to put your own values in.

Here are the things you'll need to know:

  1. _YOUR_DOMAIN_ - Where your instance will live on the internet e.g. "__example.com__".
  2. _YOUR_APP_NAME_ - What dokku will call your app. e.g. "__mastodon__".
  3. _YOUR_ACCOUNT_NAME_ - Your handle on the new server. Mine is __pieceofthepie__.
  4. _YOUR_EMAIL_ - We won't be using email but you should probably use a real one.

### Pulling my project
In a projects folder you'll want to pull down my modifications. We need this because the LinuxServer.io image is not fully compatible without some modification.

```bash
git pull github.com/cooperaj/dokku-mastodon ${YOUR_DOMAIN}
cd ${YOUR_DOMAIN}
```

### Installing service plugins

```bash
# SSH onto your server, then run

sudo dokku plugin:install https://github.com/dokku/dokku-postgres.git postgres
sudo dokku plugin:install https://github.com/dokku/dokku-redis.git redis

# Alternatively you can use the local client (which is what we'll do from now on)

export DOKKU_HOST=${YOUR_DOMAIN}
dokku plugin:install https://github.com/dokku/dokku-postgres.git postgres
dokku plugin:install https://github.com/dokku/dokku-redis.git redis
```

### Setting it up
This first series of commands is about configuring our Mastodon container within Dokku and gets us to the point where we can spin something up, though we'll do that later as we have some Mastodon configuration we also want to do.

```bash
DOKKU_HOST=${YOUR_DOMAIN} dokku apps:create ${YOUR_APP_NAME}

# At this point you have an app and Dokku is able to figure out your host
# using that, so no need to specify the DOKKU_HOST

# Create the database and cache support services
dokku postgres:create ${YOUR_APP_NAME}
dokku redis:create ${YOUR_APP_NAME}

# Use Dokku magic to inject connection credentials into our app
dokku postgres:link ${YOUR_APP_NAME}
dokku redis:link ${YOUR_APP_NAME}

# Set our website domain and enable LetsEncrypt
# If it's your first time you may be prompted to set the administrator email
dokku domains:set ${YOUR_DOMAIN}
dokku letsencrypt:enable ${YOUR_DOMAIN}

# Make sure our storage is persisted across container rebuilds by
# giving it somewhere to live
dokku storage:ensure-directory mastodon
dokku storage:mount /var/lib/dokku/data/storage/mastodon:/config

# This tells dokku where our Mastodon container will expose it's services
dokku proxy:ports-set http:80:80 https:443:443

# Allows users to upload more than the 1MB default. Mastodon limits files 
# 40MB so this seems like a safe margin of error.
dokku nginx:set client-max-body-size 50m
```

Now we want to configure our Mastodon application with some things as per [their documentation](https://docs.joinmastodon.org/admin/config/)

```bash
# Tell the instance where it lives
dokku config:set LOCAL_DOMAIN=${YOUR_DOMAIN}

# The next series of commands needs docker to function. Ensure you 
# have it locally or run these on the server. If running on the 
# server ensure you set the app name (see dokku config:help)
dokku config:set SECRET_KEY_BASE=\
$(docker run --rm -it -w /app/www --entrypoint rake \
lscr.io/linuxserver/mastodon:latest secret)

dokku config:set OTP_SECRET=\
$(docker run --rm -it -w /app/www --entrypoint rake \
lscr.io/linuxserver/mastodon:latest secret)

# This outputs some strings you can copy in the commands below
docker run --rm -it -w /app/www --entrypoint rake \
lscr.io/linuxserver/mastodon:latest mastodon:webpush:generate_vapid_key

dokku config:set VAPID_PRIVATE_KEY=${COPY_PRIVATE_KEY_HERE}
dokku config:set VAPID_PUBLIC_KEY=${COPY_PUBLIC_KEY_HERE}
```

The eagle eyed amongst you[^2] may have spotted that we've not configured any email server settings. This is because, as a single user instance, I don't see the need to[^3].  Nor have I setup [Elasticsearch](https://www.elastic.co/elasticsearch/) for much the same reason.

### Translation
You might want to enable the built in post translation Mastodon 4.0 offers. This needs a freely available API key from [DeepL](https://www.deepl.com/pro-api?cta=header-pro-api/) which you can then set.

```bash
dokku config:set DEEPL_API_KEY=${DEEPL_API_KEY}
```

### Running it!
Finally, the moment you've been waiting for. Assuming you've entered all the above configuration correctly you can now push the project and watch it appear on the internet.

```bash
git push dokku
```

If all goes well you should see your project build and deploy and finally be presented with a successful deployment message with your URL.

Feel free to watch your Mastodon instance boot up with `dokku logs -t`

## Logging in for the first time?
Because we've not setup email for our server we're going to need to do some manual work on our account. Fortunately it's not too tricky. SSH on to your server and run the following

```bash
sudo docker ps

# Take note of the container ID for your running Mastodon container,
# it'll likely be named ${YOUR_DOMAIN}.web.1
sudo docker exec -it ${COPY_CONTAINER_ID} /bin/sh

# Inside the container run this.
# It'll spit out a password. Take a note of that, you'll need it!
RAILS_ENV=production /app/www/bin/tootctl accounts create \
${YOUR_ACCOUNT_NAME} --email ${YOUR_EMAIL} --confirmed --role Owner

# You did take a note of that password right? 
exit
```

## We're done!
Head over to your new instance at `https://${YOUR_DOMAIN}` and login with your username (`${YOUR_ACCOUNT_NAME}`) and password. Then promptly change your password.

There's a lot to learn about Mastodon at this point. I suggest you take a moment to play around in the Administration area and see whats what. Additionally, because you're not following anyone, and they're not following you, it'll be a very quiet place. 

To get a proper feel for things, and before I migrated fully, I followed a few bigger and more prolific accounts. Find their full name on their instances (maybe someone like [_@aral@mastodon.ar.al_](https://mastodon.ar.al/@aral)?) paste it into your Mastodon search bar and when they show up click follow. You'll now be getting their posts and their boosts, which will expose you to more people who you can follow.

Go nuts, follow people. Take a look at your server load and disk usage every now and then so you know if you need to scale up.

## Things you might want to do
  1. Use an S3 compatible storage bucket. Check out the [Mastodon documentation](https://docs.joinmastodon.org/admin/config/#cdn) for details on setting up your storage on a pay per use system like Amazon S3, [Vultr Object Storage](https://www.vultr.com/products/object-storage/) or the like.
  2. Add your instance to a [Mastodon Relay](https://github.com/brodi1/activitypub-relays). A relay funnels all posts from any other instance into yours. Just as if someone on your instance was following *everyone* on theirs. Be prepared for the additional load, storage, memory and bandwidth requirements.
  3. Configure your instance to be a single user only (Single User Mode)
  4. Backups.

### Single User Mode
Mastodon fully supports a user being the only account on the server. 

```bash
# In your ${YOUR_DOMAIN} folder

# Be aware that since our app is now running this will result in 
# downtime as Dokku restarts the service with the new configuration.
dokku config:set SINGLE_USER_MODE=true
```

### Backups
If you've got this far you know backups are ridiculously important. There are three things you need to be backing up with this setup 

  1. The storage directory `/var/lib/dokku/data/storage/mastodon`.
  2. The PostgreSQL database.
  3. The Redis store.

The first one isn't massively tricky, it can just be massive. A good reason to possibly be using that S3 compatible bucket.

The next two are a little easier. Just check out the options the plugins offer in Dokku.

```bash
dokku postgres 
# or
dokku redis
```

As you can see both offer built in scheduled backups to S3 compatible storage. You just need to configure it. Additionally they support a standard export operation that you can script into your own backup solution (maybe the one you use for the storage folder?).

## The End
At this point you should have a running Mastodon instance. You might be following some people, you may even have people following you. You might consider migrating your account from that big instance you're on to this one, or you may just return to Twitter. Hopefully not though.

[^1]: After an appropriate amount of time on a larger instance gathering followers, and people to follow. If you dive straight into a solo user instance you will find it a very quiet place.

[^2]: Or, at least, those who have read the Mastodon documentation

[^3]: Given the Dokku primer given in this post you should easily be able to setup something like [Sendgrid](https://sendgrid.com).